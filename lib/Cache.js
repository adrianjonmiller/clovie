import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ServiceProvider } from '@brickworks/engine';

export class Cache extends ServiceProvider {
  static manifest = {
    name: 'Clovie Cache',
    namespace: 'cache',
    version: '1.0.0'
  };


  #cacheDir = null;
  #cacheFile = null;
  #config = null;

  initialize(useContext, config) {
    this.#cacheDir = config.outputDir || './dist';
    this.#cacheFile = path.join(this.#cacheDir, '.clovie-cache.json');
    this.#config = config;
    
    // Initialize cache in stable storage
    const { stable } = useContext();
    if (!stable.get(['cache'])) {
      stable.set(['cache'], {
        files: {},
        lastBuild: null,
        stats: { totalBuilds: 0, averageBuildTime: 0 }
      });
    }
    
    // Load from file if it exists (migration from file-based cache)
    this.#migrateFromFile(stable);
  }

  actions(useContext) {
    const { stable, config } = useContext();
    
    const actions = {
      getFileHash: (filePath) => {
        try {
          if (!fs.existsSync(filePath)) return null;
          const content = fs.readFileSync(filePath);
          return crypto.createHash('md5').update(content).digest('hex');
        } catch (err) {
          return null;
        }
      },

      hasChanged: (filePath) => {
        const currentHash = actions.getFileHash(filePath);
        let cache = stable.get(['cache']);
        if (!cache || !cache.files) {
          cache = {
            files: {},
            lastBuild: null,
            stats: { totalBuilds: 0, averageBuildTime: 0 }
          };
          stable.set(['cache'], cache);
          return true; // If no cache exists, consider it changed
        }
        const cachedHash = cache.files[filePath];
        
        if (currentHash !== cachedHash) {
          cache.files[filePath] = currentHash;
          stable.set(['cache'], cache);
          return true;
        }
        return false;
      },

      getChangedFiles: (files) => {
        return files.filter(file => actions.hasChanged(file));
      },

      markBuilt: () => {
        let cache = stable.get(['cache']);
        if (!cache) {
          // Initialize cache if it doesn't exist
          cache = {
            files: {},
            lastBuild: Date.now(),
            stats: { totalBuilds: 1, averageBuildTime: 0 }
          };
          stable.set(['cache'], cache);
        } else {
          // Update lastBuild timestamp
          stable.set(['cache', 'lastBuild'], Date.now());
          // Increment totalBuilds using the new update function
          stable.update(['cache', 'stats', 'totalBuilds'], (value) => (value || 0) + 1);
        }
        
        // Save to file
        try {
          const cacheDir = this.#config.outputDir || './dist';
          const cacheFile = path.join(cacheDir, '.clovie-cache.json');
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          // Get the updated cache from stable storage
          const updatedCache = stable.get(['cache']);
          fs.writeFileSync(cacheFile, JSON.stringify(updatedCache, null, 2));
          console.log(`✅ Cache saved successfully`);
        } catch (err) {
          console.warn('⚠️  Could not save cache to file:', err.message);
        }
      },

      getBuildStats: () => {
        const cache = stable.get(['cache']);
        if (!cache) {
          return { 
            totalFiles: 0, 
            changedFiles: 0,
            lastBuild: null,
            totalBuilds: 0
          };
        }
        const totalFiles = Object.keys(cache.files || {}).length;
        const changedFiles = Object.values(cache.files || {}).filter(hash => hash !== null).length;
        return { 
          totalFiles, 
          changedFiles,
          lastBuild: cache.lastBuild,
          totalBuilds: cache.stats?.totalBuilds || 0
        };
      },

      clear: () => {
        const emptyCache = { files: {}, lastBuild: null, stats: { totalBuilds: 0, averageBuildTime: 0 } };
        stable.set(['cache'], emptyCache);
        // Save to file
        try {
          const cacheDir = this.#config.outputDir || './dist';
          const cacheFile = path.join(cacheDir, '.clovie-cache.json');
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          const cacheData = stable.get(['cache']);
          fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (err) {
          console.warn('⚠️  Could not save cache to file');
        }
        console.log('🗑️  Cache cleared');
      },

      load: () => stable.get(['cache']),

      save: () => {
        try {
          if (!fs.existsSync(this.#cacheDir)) {
            fs.mkdirSync(this.#cacheDir, { recursive: true });
          }
          const cacheData = stable.get(['cache']);
          fs.writeFileSync(this.#cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (err) {
          console.warn('⚠️  Could not save cache to file');
        }
      }
    };
    
    return actions;
  }

  #migrateFromFile(stable) {
    try {
      if (fs.existsSync(this.#cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.#cacheFile, 'utf8'));
        // Ensure files property is an object, not undefined
        if (!data.files) {
          data.files = {};
        }
        stable.set(['cache'], data);
        console.log('📋 Cache migrated from file to stable storage');
        // Optionally remove the old file
        // fs.unlinkSync(this.#cacheFile);
      }
    } catch (err) {
      console.warn('⚠️  Could not migrate cache from file');
    }
  }
}
