import { ServiceProvider } from '@jucie.io/engine';
import { normalizeToFactories } from '../utils/normalizeToFactories.js';
import { viewsToRoutes, pagesToRoutes } from '../utils/viewsToRoutes.js';
import { defineRoutes } from '../factories/routes.js';
import { defineHooks } from '../factories/hooks.js';
import { defineMiddleware } from '../factories/middleware.js';

export class Run extends ServiceProvider {
  static manifest = {
    name: 'Run',
    namespace: 'run',
  };

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
        const server = useContext('server');
        if (!server) {
          throw new Error('Server service not available. Use type: "server" in opts.');
        }
        
        log.info('🌐 Starting production server...');
        await this.#build(opts);
        await this.#serve(opts);

        if (typeof opts.beforeListen === 'function') {
          await opts.beforeListen(opts);
        }

        await server.listen(opts);

        if (typeof opts.afterListen === 'function') {
          await opts.afterListen(server.getHttpServer(), opts);
        }
      },
      
      dev: async () => {
        const [relay, liveReload, server] = useContext('relay', 'liveReload', 'server');
        
        log.info('🚀 Starting development server...');
        
        // Build initial version
        await this.#build(configurator.opts);

        if (configurator.opts.type === 'server') {
          await this.#serve(configurator.opts);
        }

        if (typeof configurator.opts.beforeListen === 'function') {
          await configurator.opts.beforeListen(configurator.opts);
        }
        
        if (server) {
          await server.listen(configurator.opts);
        }

        if (typeof configurator.opts.afterListen === 'function') {
          await configurator.opts.afterListen(server?.getHttpServer(), configurator.opts);
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

  async #build(opts) {
    const [file, compile, log] = this.useContext('file', 'compile', 'log');
    
    log.info('🧹 Cleaning output directory...');
    file.clean(opts.outputDir);

    log.info('🚀 Starting compilation...');
    const startTime = Date.now();

    const promises = [
      compile.assets(opts),
      compile.scripts(opts),
      compile.styles(opts),
      compile.partials(opts),
      compile.views(opts),
    ];

    if (opts.type === 'static') {
      promises.push(compile.routes(opts));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log.info(`✅ Build completed in ${duration}s`);
    
    return results;
  }

  async #serve (opts) {
    const [server, file, liveReload] = this.useContext('server', 'file', 'liveReload');
    const services = { file, liveReload };

    const viewRoutes = viewsToRoutes(opts, services);
    const pageRoutes = pagesToRoutes(opts.routes, opts, services);

    const factories = [
      ...normalizeToFactories(opts.hooks, defineHooks),
      ...normalizeToFactories(opts.middleware, defineMiddleware),
      ...normalizeToFactories(opts.api, defineRoutes),
      ...normalizeToFactories([...viewRoutes, ...pageRoutes], defineRoutes),
    ];

    if (factories.length) {
      server.use(...factories);
    }
  }

  async #watch(opts) {
    const [file, compile, log] = this.useContext('file', 'compile', 'log');
    log.info('Watching for changes...');

    const closeWatchers = [];

    if (opts.partials) {
      closeWatchers.push(file.watch(opts.partials, async (partialPath) => {
        await Promise.all([
          compile.partial(partialPath, opts),
          compile.views(opts),
          (opts.type === 'static' && compile.routes(opts))
        ]);
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
          case 'add':
            await compile.view(viewPath, opts);
            break;
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