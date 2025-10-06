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
      set: (filePath, content) => {
        const hash = this.#createHash(content);
        const cacheEntry = {
          filePath,
          hash,
          timestamp: Date.now()
        };
        stable.set(['.cache', filePath], cacheEntry);
        return hash;
      },
      
      /**
       * Get cached content
       */
      get: (filePath) => {
        const entry = stable.get(['.cache', filePath]);
        return entry ? entry.content : null;
      },
      
      /**
       * Check if content has changed by comparing hashes
       */
      hasChanged: (filePath, newContent) => {
        return this.#hasChanged(filePath, newContent);
      },
      
      /**
       * Get hash of cached content
       */
      getHash: (filePath) => {
        const entry = stable.get(['.cache', filePath]);
        return entry ? entry.hash : null;
      },
      
      /**
       * Get cache entry metadata
       */
      getEntry: (filePath) => {
        return stable.get(['.cache', filePath]);
      },
      
      /**
       * Clear cache entry
       */
      clear: (filePath) => {
        stable.delete(['.cache', filePath]);
      },
      
      /**
       * Clear all cache
       */
      clearAll: () => {
        stable.delete(['.cache']);
      }
    }
  }

  #hasChanged(filePath, newContent) {
    const stable = this.useContext('stable');
    const entry = stable.get(['.cache', filePath]);
    
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