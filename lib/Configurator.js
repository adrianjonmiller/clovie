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
  #config = null;
  #configPath = null;
  #transform = null;
  #stopWacher = null
  
  async initialize(_, config) {    
    this.#transform = config.transform || ((config) => config);
    this.#configPath = config.configPath;

    queueMacrotask(async () => {
      if (this.#configPath) {
        await this.#initializeConfig(this.#configPath);
      }
    });
  }

  actions(useContext) {
    const stable = useContext('stable');
    return {
      onReady: (callback) => {
        if (this.#ready) {
          callback(this.#config);
        }
        this.#callbacks.ready.add(callback);
        return () => this.#callbacks.ready.delete(callback);
      },
      onUpdate: (callback) => {
        this.#callbacks.update.add(callback);
        return () => this.#callbacks.update.delete(callback);
      },
      get: (...keys) => {
        return stable.get(['.config', ...keys]);
      },
      has: (...keys) => {
        return stable.has(['.config', ...keys]);
      },
      setConfigPath: async (path) => {
        const relay = useContext('relay');
        this.#configPath = path;
        relay?.broadcast('config:clear');

        if (this.#stopWacher) {
          this.#stopWacher();
          this.#stopWacher = null;
        }
        if (this.#configPath) {
          await this.#initializeConfig(this.#configPath);
        }
      }
    };
  }

  async #initializeConfig(path) {
    if (this.#stopWacher) {
      this.#stopWacher();
      this.#stopWacher = null;
    }
    const [stable, relay, log] = this.useContext('stable', 'relay', 'log');
    const file = this.useContext('file');
    path = path || this.#configPath;
    
    if (path) {
      const config = await this.#importConfig(path);
      this.#config = await this.#transform(config, log);
      stable.set('.config', this.#config);
      relay?.broadcast('config:ready', this.#config);
      this.#callCallbacks('ready', this.#config);

      this.#stopWacher = file.watch(path, async () => {
        const config = await this.#importConfig(path);
        this.#config = await this.#transform(config, log);
        stable.set('.config', this.#config);
        relay?.broadcast('config:update', this.#config);
        this.#callCallbacks('update', this.#config);
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
