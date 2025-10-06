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
      build: async (name) => {
        
      },
      serve: (name) => {
        log.info(`Creating ${name}`);
      },
      dev: async () => {
        const [ relay, liveReload, configurator ] = useContext('relay', 'liveReload', 'configurator')
        await this.#build();
        await this.#devServer();
        await this.#watch();

        relay.from(configurator).subscribe('config:reload', async (config) => {
          await this.#build();
          liveReload.notifyReload();
        }); 
      }
    }
  }

  #devServer() {
    this.useContext('server')?.listen(3000);
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