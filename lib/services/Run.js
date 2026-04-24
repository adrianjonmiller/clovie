import { ServiceProvider } from '@jucie.io/engine';
import { normalizeToFactories } from '../utils/normalizeToFactories.js';
import { viewsToRoutes, pagesToRoutes, resolveRoutes } from '../utils/viewsToRoutes.js';
import { defineRoutes as defineServerRoutes, defineHooks as defineServerHooks, defineMiddleware as defineServerMiddleware } from '@jucie.io/engine-server';
import { extractScriptSources } from '../utils/extractScripts.js';

export class Run extends ServiceProvider {
  static manifest = {
    name: 'Run',
    namespace: 'run',
  };

  #currentEntryPoints = [];

  actions(useContext) {
    const [configurator, log] = useContext('configurator', 'log');

    return {
      build: async () => {
        log.info('🔨 Building project...');
        await this.#build(configurator.opts);
        log.info('✅ Build completed successfully');
      },
      
      serve: async () => {
        const opts = configurator.opts;
        await this.#normalizeRoutes(opts);
        const server = useContext('server');
        if (!server) {
          throw new Error('Server service not available. Use type: "server" in opts.');
        }
        
        log.info('🌐 Starting production server...');
        await this.#build(opts);
        await this.#serve(opts);

        if (typeof opts.beforeListen === 'function') {
          await opts.beforeListen(useContext, opts);
        }

        await server.listen(opts);

        if (typeof opts.afterListen === 'function') {
          await opts.afterListen(useContext, opts, server.getHttpServer());
        }
      },
      
      dev: async () => {
        const [relay, liveReload, server] = useContext('relay', 'liveReload', 'server');
        
        log.info('🚀 Starting development server...');
        
        await this.#normalizeRoutes(configurator.opts);

        // Build initial version
        await this.#build(configurator.opts);

        if (configurator.opts.type === 'server') {
          await this.#serve(configurator.opts);
        }

        if (typeof configurator.opts.beforeListen === 'function') {
          await configurator.opts.beforeListen(useContext, configurator.opts);
        }
        
        if (server) {
          await server.listen(configurator.opts);
        }

        if (typeof configurator.opts.afterListen === 'function') {
          await configurator.opts.afterListen(useContext, configurator.opts, server?.getHttpServer());
        }

        if (liveReload && server) {
          await liveReload.initializeServer(server.getHttpServer(), configurator.opts);
        }
        
        // Start watching
        await this.#watch(configurator.opts);
        
        // Setup opts reload handling
        if (relay && configurator) {
          relay.from(configurator).subscribe('opts:reload', async (opts) => {
            await this.#build(opts);
            liveReload?.notifyReload();
          });
        }
      }
    }
  }

  async #normalizeRoutes(opts) {
    opts.api = opts.api && opts.api.length ? await resolveRoutes(opts.api, (...args) => this.inject(...args), opts) : [];
    opts.routes = opts.routes && opts.routes.length ? await resolveRoutes(opts.routes, (...args) => this.inject(...args), opts) : [];
    return opts;
  }

  async #build(opts) {
    const [file, compile, log] = this.inject('file', 'compile', 'log');
    
    log.info('🧹 Cleaning output directory...');
    file.clean(opts.outputDir);

    log.info('🚀 Starting compilation...');
    const startTime = Date.now();

    opts = await this.#normalizeRoutes(opts);

    // Phase 1: partials must load before templates can render
    await compile.partials(opts);

    // Phase 2: render views/routes (to extract script refs) + assets/styles in parallel
    const phase2 = [
      compile.assets(opts),
      compile.styles(opts),
      compile.views(opts),
    ];

    if (opts.type === 'static') {
      phase2.push(compile.routes(opts));
    }

    const [, , viewHtml, routeHtml] = await Promise.all(phase2);

    // Phase 3: discover script entry points from rendered HTML, then build
    const allHtml = [...(viewHtml || []), ...(routeHtml || [])];
    await this.#buildScripts(opts, allHtml, compile, log);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log.info(`✅ Build completed in ${duration}s`);
  }

  async #buildScripts(opts, htmlStrings, compile, log) {
    if (!opts.scripts) return;

    const esBuild = this.inject('esBuild');
    if (!esBuild) return;

    const entryPoints = extractScriptSources({
      htmlStrings,
      scriptsDir: opts.scripts,
      viewsDir: opts.views,
      partialsDir: opts.partials,
      routes: opts.routes,
    });
    this.#currentEntryPoints = entryPoints;

    if (entryPoints.length === 0) {
      log.debug('No script references found in templates, skipping script build');
      return;
    }

    log.debug(`Discovered ${entryPoints.length} script entry point(s) from templates`);
    esBuild.configure({ entryPoints });
    await compile.scripts(opts);
  }

  async #serve (opts) {
    const [server, file, liveReload] = this.inject('server', 'file', 'liveReload');
    const services = { file, liveReload };

    const viewRoutes = viewsToRoutes(opts, services);
    const pageRoutes = pagesToRoutes(opts.routes, opts, services);

    const factories = [
      ...normalizeToFactories(opts.hooks, defineServerHooks),
      ...normalizeToFactories(opts.middleware, defineServerMiddleware),
      ...normalizeToFactories(opts.api, defineServerRoutes),
      ...normalizeToFactories([...viewRoutes, ...pageRoutes], defineServerRoutes),
    ];

    if (factories.length) {
      server.use(...factories);
    }
  }

  async #watch(opts) {
    const [file, compile, log] = this.inject('file', 'compile', 'log');
    log.info('Watching for changes...');

    const closeWatchers = [];

    const rebuildScriptsIfNeeded = async (htmlStrings) => {
      if (!opts.scripts) return;

      const esBuild = this.inject('esBuild');
      if (!esBuild) return;

      const newEntryPoints = extractScriptSources({
        htmlStrings,
        scriptsDir: opts.scripts,
        viewsDir: opts.views,
        partialsDir: opts.partials,
        routes: opts.routes,
      });
      const changed = newEntryPoints.length !== this.#currentEntryPoints.length ||
        newEntryPoints.some((ep, i) => ep !== this.#currentEntryPoints[i]);

      if (changed) {
        this.#currentEntryPoints = newEntryPoints;
        if (newEntryPoints.length > 0) {
          log.debug(`Script entry points changed (${newEntryPoints.length}), rebuilding...`);
          esBuild.configure({ entryPoints: newEntryPoints });
          await esBuild.rebuild();
        }
      }
    };

    if (opts.partials) {
      closeWatchers.push(file.watch(opts.partials, async (partialPath) => {
        await compile.partial(partialPath, opts);
        const [viewHtml, routeHtml] = await Promise.all([
          compile.views(opts),
          (opts.type === 'static' ? compile.routes(opts) : Promise.resolve([]))
        ]);
        await rebuildScriptsIfNeeded([...viewHtml, ...routeHtml]);
      }));
    }
    
    if (opts.styles) {
      closeWatchers.push(file.watch(opts.styles, async (stylePath, type) => {
        switch (type) {
          case 'change':
          case 'add':
            compile.style(stylePath, opts);
            break;
          case 'unlink':
            compile.remove(stylePath)
            break;
        }
      }))
    }

    if (opts.assets) {
      closeWatchers.push(file.watch(opts.assets, async (assetPath, type) => {
        switch (type) {
          case 'change':
          case 'add':
            compile.asset(assetPath, opts)
            break;
          case 'unlink':
            compile.remove(assetPath)
            break;
        }
      }));
    }

    if (opts.scripts) {
      compile.watchScripts(opts);
    }
    
    if (opts.views) {
      closeWatchers.push(file.watch(opts.views, async (viewPath, type) => {
        log.debug('View changed, recompiling...');
        switch (type) {
          case 'change':
          case 'add': {
            const content = await compile.view(viewPath, opts);
            await rebuildScriptsIfNeeded([content].filter(Boolean));
            break;
          }
          case 'unlink':
            compile.remove(viewPath)
            break;
        }
      }));
    }

    return () => {
      closeWatchers.forEach(watcher => watcher());
    }
  }
}