import { ServiceProvider } from '@brickworks/engine';
import { File } from './File.js';
import { queueMacrotask } from './utils/tasks.js';

export class Configurator extends ServiceProvider {
  static manifest = {
    name: 'Configurator',
    namespace: 'configurator',
    version: '1.0.0',
    dependencies: [File]
  };
  #callbacks = {
    ready: new Set(),
    update: new Set()
  }
  #ready = false;
  #opts = null;
  #optsPath = null;
  #transform = null;
  #stopWacher = null
  
  async initialize(_, config) {    
    this.#transform = config.transform || ((config) => config);
    this.#optsPath = config.optsPath;

    queueMacrotask(async () => {
      if (this.#optsPath) {
        await this.#initializeConfig(this.#optsPath);
      }
    });
  }

  getters() {
    return {
      opts: () => this.#opts,
    }
  }

  actions(useContext) {
    return {
      onReady: (callback) => {
        if (this.#ready) {
          callback(this.#opts);
        }
        this.#callbacks.ready.add(callback);
        return () => this.#callbacks.ready.delete(callback);
      },
      onUpdate: (callback) => {
        this.#callbacks.update.add(callback);
        return () => this.#callbacks.update.delete(callback);
      },
      has: (key) => {
        return Object.hasOwn(this.#opts, key);
      },
      setConfigPath: async (path) => {
        const relay = useContext('relay');
        this.#optsPath = path;
        relay?.broadcast('config:clear');

        if (this.#stopWacher) {
          this.#stopWacher();
          this.#stopWacher = null;
        }
        if (this.#optsPath) {
          await this.#initializeConfig(this.#optsPath);
        }
      }
    };
  }

  async #initializeConfig(path) {
    if (this.#stopWacher) {
      this.#stopWacher();
      this.#stopWacher = null;
    }

    const [file, log] = this.useContext('file', 'log');
    path = path || this.#optsPath;
    
    if (path) {
      const config = await this.#importConfig(path);
      this.#opts = await this.#transform(config, log);
      this.#callCallbacks('ready', this.#opts);

      this.#stopWacher = file.watch(path, async () => {
        const config = await this.#importConfig(path);
        this.#opts = await this.#transform(config, log);
        this.#callCallbacks('update', this.#opts);
      });
    }
  }

  #callCallbacks(type, config) {
    this.#callbacks[type].forEach(callback => callback(config));
  }

  async #importConfig(path) {
    const configModule = await import(`${path}?t=${Date.now()}`);
    return (configModule.default || configModule);
  }
}
