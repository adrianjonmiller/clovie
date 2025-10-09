import { ServiceProvider } from '@brickworks/engine';
import { createReactor } from '@brickworks/engine/state';
import path from 'path';

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
        await this.#initializeDatabase();
        const opts = configurator.opts;
        const server = useContext('server');
        if (!server) {
          throw new Error('Server service not available. Use type: "server" in opts.');
        }
        
        log.info('🌐 Starting production server...');
        await this.#build(opts); // Build first
        await this.#serve(opts);
        await server.listen(opts);
      },
      
      dev: async () => {
        await this.#initializeDatabase();

        const [relay, liveReload, server] = useContext('relay', 'liveReload', 'server');
        
        log.info('🚀 Starting development server...');
        
        // Build initial version
        await this.#build(configurator.opts);
        

        if (configurator.opts.type === 'server') {
          await this.#serve(configurator.opts);
        }
        
        // Start dev server
        if (server) {
          await server.listen(configurator.opts);
        }
        
        // Start watching
        await this.#watch(configurator.opts);
        
        // Setup opts reload handling
        if (relay && configurator) {
          relay.from(configurator).subscribe('opts:reload', async (opts) => {
            await this.#build();
            liveReload?.notifyReload();
          });
        }
      }
    }
  }

  async #initializeDatabase() {
    const database = this.useContext('database');
    if (database && !database.isInitialized()) {
      await database.initializeDb();
      console.log('Database initialized', database.isInitialized());
    }
  }

  async #build(opts) {
    const [file, compile, log, router] = this.useContext('file', 'compile', 'log', 'router');
    
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
    const router = this.useContext('router');
    await router.setHooks(opts);
    await router.serveApi(opts);
    await router.serveRoutes(opts);
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
      closeWatchers.push(file.watch(opts.scripts, async (scriptPath, type) => {
        switch (type) {
          case 'change':
          case 'add':
            compile.script(scriptPath, opts);
            break;
          case 'unlink':
            compile.remove(scriptPath)
            break;
        }
      }));
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