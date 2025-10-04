import { ServiceProvider } from '@brickworks/engine';
import crypto from 'crypto';

export class Cache extends ServiceProvider {
  static manifest = {
    name: 'Clovie Cache',
    namespace: 'cache',
    version: '1.0.0',
  }

  actions(useContext) {
    const { stable } = useContext();
    return {
      /**
       * Set cached content with hash for comparison
       */
      set: (key, content) => {
        const hash = this.#createHash(content);
        const cacheEntry = {
          content,
          hash,
          timestamp: Date.now()
        };
        stable.set(['cache', key], cacheEntry);
        return hash;
      },
      
      /**
       * Get cached content
       */
      get: (key) => {
        const entry = stable.get(['cache', key]);
        return entry ? entry.content : null;
      },
      
      /**
       * Check if content has changed by comparing hashes
       */
      hasChanged: (key, newContent) => {
        return this.#hasChanged(key, newContent);
      },
      
      /**
       * Get hash of cached content
       */
      getHash: (key) => {
        const entry = stable.get(['cache', key]);
        return entry ? entry.hash : null;
      },
      
      /**
       * Get cache entry metadata
       */
      getEntry: (key) => {
        return stable.get(['cache', key]);
      },
      
      /**
       * Check if file should be written to disk (content changed)
       */
      shouldWrite: (key, content) => {
        return this.#hasChanged(key, content);
      },
      
      /**
       * Clear cache entry
       */
      clear: (key) => {
        stable.delete(['cache', key]);
      },
      
      /**
       * Clear all cache
       */
      clearAll: () => {
        stable.delete(['cache']);
      }
    }
  }

  #hasChanged(key, newContent) {
    const stable = this.useContext('stable');
    const entry = stable.get(['cache', key]);
    
    if (!entry) {
      return true; // No cache entry means it's new/changed
    }
    
    const newHash = this.#createHash(newContent);
    return entry.hash !== newHash;
  }
  
  /**
   * Create consistent hash for content
   */
  #createHash(content) {
    // Handle different content types
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }
}