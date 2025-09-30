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
  #cache = null;

  initialize(useContext, config) {
    this.#cacheDir = config.outputDir || './dist';
    this.#cacheFile = path.join(this.#cacheDir, '.clovie-cache.json');
    this.#cache = this.#loadCache();
  }

  actions(useContext) {
    return {
      getFileHash: (filePath) => this.#getFileHash(filePath),
      hasChanged: (filePath) => this.#hasChanged(filePath),
      getChangedFiles: (files) => this.#getChangedFiles(files),
      markBuilt: () => this.#markBuilt(),
      getBuildStats: () => this.#getBuildStats(),
      clear: () => this.#clear(),
      load: () => this.#loadCache(),
      save: () => this.#saveCache()
    };
  }

  #loadCache() {
    try {
      if (fs.existsSync(this.#cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.#cacheFile, 'utf8'));
        console.log('📋 Cache loaded successfully');
        return data;
      }
    } catch (err) {
      console.warn('⚠️  Could not load cache, starting fresh');
    }
    return { files: {}, lastBuild: null, stats: { totalBuilds: 0, averageBuildTime: 0 } };
  }

  #saveCache() {
    try {
      if (!fs.existsSync(this.#cacheDir)) {
        fs.mkdirSync(this.#cacheDir, { recursive: true });
      }
      fs.writeFileSync(this.#cacheFile, JSON.stringify(this.#cache, null, 2));
    } catch (err) {
      console.warn('⚠️  Could not save cache');
    }
  }

  #getFileHash(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (err) {
      return null;
    }
  }

  #hasChanged(filePath) {
    const currentHash = this.#getFileHash(filePath);
    const cachedHash = this.#cache.files[filePath];
    
    if (currentHash !== cachedHash) {
      this.#cache.files[filePath] = currentHash;
      return true;
    }
    return false;
  }

  #getChangedFiles(files) {
    return files.filter(file => this.#hasChanged(file));
  }

  #markBuilt() {
    this.#cache.lastBuild = Date.now();
    this.#cache.stats.totalBuilds++;
    this.#saveCache();
  }

  #getBuildStats() {
    const totalFiles = Object.keys(this.#cache.files).length;
    const changedFiles = Object.values(this.#cache.files).filter(hash => hash !== null).length;
    return { 
      totalFiles, 
      changedFiles,
      lastBuild: this.#cache.lastBuild,
      totalBuilds: this.#cache.stats.totalBuilds
    };
  }

  #clear() {
    this.#cache = { files: {}, lastBuild: null, stats: { totalBuilds: 0, averageBuildTime: 0 } };
    this.#saveCache();
    console.log('🗑️  Cache cleared');
  }
}
