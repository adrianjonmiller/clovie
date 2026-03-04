import { ServiceProvider } from '@jucie.io/engine';
import crypto from 'crypto';

export class PageCache extends ServiceProvider {
  static manifest = {
    name: 'Clovie Page Cache',
    namespace: 'pageCache',
    version: '1.0.0',
  }

  actions(useContext) {
    const { cache } = useContext();
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
        cache.set(['.cache', filePath], cacheEntry);
        return hash;
      },
      
      /**
       * Get cached content
       */
      get: (filePath) => {
        const entry = cache.get(['.cache', filePath]);
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
        const entry = cache.get(['.cache', filePath]);
        return entry ? entry.hash : null;
      },
      
      /**
       * Get cache entry metadata
       */
      getEntry: (filePath) => {
        return cache.get(['.cache', filePath]);
      },
      
      /**
       * Clear cache entry
       */
      clear: (filePath) => {
        cache.delete(['.cache', filePath]);
      },
      
      /**
       * Clear all cache
       */
      clearAll: () => {
        cache.delete(['.cache']);
      }
    }
  }

  #hasChanged(filePath, newContent) {
    const cache = this.useContext('cache');
    const entry = cache.get(['.cache', filePath]);
    
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