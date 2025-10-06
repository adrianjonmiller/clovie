import { ServiceProvider } from '@brickworks/engine';
import path from 'path';

export class Run extends ServiceProvider {
  static manifest = {
    name: 'Run',
    namespace: 'run',
  };

  #config = null;

  initialize(useContext, config) {
    this.#config = config;
    const [relay, configurator] = useContext('relay', 'configurator');
    if (configurator) {
      relay.on('config:update', (config) => {
        this.#config = config;
      });
    }
  }

  actions(useContext) {
    const log = useContext('log');
    return {
      build: async () => {
        log.info('🔨 Building project...');
        await this.#build();
        log.info('✅ Build completed successfully');
      },
      
      serve: async () => {
        const server = useContext('server');
        if (!server) {
          throw new Error('Server service not available. Use type: "server" in config.');
        }
        
        log.info('🌐 Starting production server...');
        await this.#build(); // Build first
        await server.listen(this.#config.port || 3000);
      },
      
      dev: async () => {
        const [relay, liveReload, configurator, server] = useContext(
          'relay', 'liveReload', 'configurator', 'server'
        );
        
        log.info('🚀 Starting development server...');
        
        // Build initial version
        await this.#build();
        
        // Start dev server
        if (server) {
          await server.listen(this.#config.port || 3000);
        }
        
        // Start watching
        await this.#watch();
        
        // Setup config reload handling
        if (relay && configurator) {
          relay.from(configurator).subscribe('config:reload', async (config) => {
            await this.#build();
            liveReload?.notifyReload();
          });
        }
      }
    }
  }


  async #build() {
    const [file, compile, log] = this.useContext('file', 'compile', 'log');
    
    log.info('🧹 Cleaning output directory...');
    file.clean(this.#config.outputDir);

    log.info('🚀 Starting compilation...');
    const startTime = Date.now();

    const results = await Promise.all([
      compile.assets(),
      compile.scripts(),
      compile.styles(),
      compile.partials(),
      compile.views(),
      compile.routes()
    ]);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log.info(`✅ Build completed in ${duration}s`);
    
    return results;
  }

  async #watch() {
    const [file, compile, log] = this.useContext('file', 'compile', 'log');
    log.info('Watching for changes...');

    const closeWatchers = [];

    if (this.#config.partials) {
      closeWatchers.push(file.watch(this.#config.partials, async (partialPath) => {
        await Promise.all([
          compile.partial(partialPath),
          compile.templates(this.#config.views),
          compile.routes(this.#config.routes)
        ]);
      }));
    }
    
    if (this.#config.styles) {
      closeWatchers.push(file.watch(this.#config.styles, async (stylePath, type) => {
        switch (type) {
          case 'change':
          case 'add':
            compile.styles(this.#config.styles);
            break;
          case 'unlink':
            compile.remove(stylePath)
            break;
        }
      }))
    }

    if (this.#config.scripts) {
      closeWatchers.push(file.watch(this.#config.scripts, async (scriptPath, type) => {
        switch (type) {
          case 'change':
          case 'add':
            compile.scripts(scriptPath)
            break;
          case 'unlink':
            compile.remove(scriptPath)
            break;
        }
      }))
    }

    if (this.#config.assets) {
      closeWatchers.push(file.watch(this.#config.assets, async (assetPath, type) => {
        switch (type) {
          case 'change':
          case 'add':
            compile.assets(assetPath)
            break;
          case 'unlink':
            compile.remove(assetPath)
            break;
        }
      }));
    }

    if (this.#config.scripts) {
      closeWatchers.push(file.watch(this.#config.scripts, async (scriptPath) => {
        switch (type) {
          case 'change':
          case 'add':
            compile.scripts(scriptPath);
            break;
          case 'unlink':
            compile.remove(scriptPath)
            break;
        }
      }));
    }
    
    if (this.#config.views) {
      closeWatchers.push(file.watch(this.#config.views, async (filePath, type) => {
        log.debug('View changed, recompiling...');
        switch (type) {
          case 'change':
          case 'add':
            await compile.template(filePath);
            break;
          case 'unlink':
            compile.remove(filePath)
            break;
        }
      }));
    }

    return () => {
      closeWatchers.forEach(watcher => watcher());
    }
  }
}