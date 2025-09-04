import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class BuildCache {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.cacheFile = path.join(cacheDir, '.atx-cache.json');
    this.cache = this.loadCache();
  }
  
  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        return JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      }
    } catch (err) {
      console.warn('⚠️  Could not load cache, starting fresh');
    }
    return { files: {}, lastBuild: null };
  }
  
  saveCache() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (err) {
      console.warn('⚠️  Could not save cache');
    }
  }
  
  getFileHash(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (err) {
      return null;
    }
  }
  
  hasChanged(filePath) {
    const currentHash = this.getFileHash(filePath);
    const cachedHash = this.cache.files[filePath];
    
    if (currentHash !== cachedHash) {
      this.cache.files[filePath] = currentHash;
      return true;
    }
    return false;
  }
  
  getChangedFiles(files) {
    return files.filter(file => this.hasChanged(file));
  }
  
  markBuilt() {
    this.cache.lastBuild = Date.now();
    this.saveCache();
  }
  
  getBuildStats() {
    const totalFiles = Object.keys(this.cache.files).length;
    const changedFiles = Object.values(this.cache.files).filter(hash => hash !== null).length;
    return { totalFiles, changedFiles };
  }
}
