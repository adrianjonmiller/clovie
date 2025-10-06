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
    const [file, compile, log, liveReload] = this.useContext('file', 'compile', 'log', 'liveReload');
    log.info('Watching for changes...');

    file.watch(this.#config.assets, async (assetPath, type) => {
      console.log('Asset changed', assetPath, type);
      switch (type) {
        case 'change':
          compile.assets(assetPath)
          break;
        case 'add':
          compile.assets(assetPath)
          break;
        case 'unlink':
          compile.assets(assetPath)
          break;
      }
    });

    file.watch(this.#config.scripts, async (scriptPath) => {
      compile.scripts(scriptPath)
    })

    file.watch(this.#config.partials, async (partialPath) => {
      return Promise.all([
        compile.partial(partialPath),
        compile.templates(this.#config.views)
      ]);
    });
    
    log.info(`Watching for views: ${this.#config.views}`);

    file.watch(this.#config.views, async (filePath) => {
      log.debug('View changed, recompiling...');
      console.log('View changed', filePath);
      await compile.template(filePath);
      liveReload.notifyReload();
    });
  }
}