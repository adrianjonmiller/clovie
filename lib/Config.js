import { ServiceProvider } from '@brickworks/engine';
import { discoverProjectStructure } from './utils/discover.js';

export class Config extends ServiceProvider {
  static manifest = {
    name: 'Clovie Config',
    namespace: 'config',
    version: '1.0.0'
  };

  #discoveredConfig = null;

  static discover = (config) => discoverProjectStructure(config);

  actions(_, config) {
    return {
      /**
       * Get the discovered configuration
       */
      get: (key) => {
        return key ? this.#discoveredConfig?.[key] : this.#discoveredConfig;
      },

      discover: async (newConfig = config) => {
        try {
          this.#discoveredConfig = await discoverProjectStructure(newConfig);
          return this.#discoveredConfig;
        } catch (err) {
          console.error('Discovery failed:', err);
          // Fall back to original config
          this.#discoveredConfig = config;
        }
      },

      /**
       * Set the discovered configuration (for manual updates)
       */
      set: (config) => {
        this.#discoveredConfig = config;
      },

      /**
       * Check if a config value exists
       */
      has: (key) => {
        return this.#discoveredConfig && key in this.#discoveredConfig;
      },

      /**
       * Get all discovered paths for file watching
       */
      getWatchPaths: () => {
        if (!this.#discoveredConfig) return [];
        
        return [
          this.#discoveredConfig.views,
          this.#discoveredConfig.partials,
          this.#discoveredConfig.styles,
          this.#discoveredConfig.scripts,
          this.#discoveredConfig.assets
        ].filter(Boolean);
      }
    };
  }
}
