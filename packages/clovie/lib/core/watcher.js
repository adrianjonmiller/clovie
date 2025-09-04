import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { BuildCache } from './cache.js';

export class SmartWatcher {
  constructor(atxInstance) {
    this.atx = atxInstance;
    this.watcher = null;
    this.cache = new BuildCache(atxInstance.config.outputDir);
    this.debounceTimer = null;
    this.isWatching = false;
  }
  
  start() {
    if (this.isWatching) return;
    
    console.log('👀 Starting smart file watcher...');
    this.isWatching = true;
    
    // Watch views directory
    if (this.atx.config.views) {
      this.watcher = chokidar.watch(this.atx.config.views, {
        ignored: /(^|[\/\\])\../, // Ignore hidden files
        persistent: true
      });
      
      this.watcher.on('change', (filePath) => this.handleViewChange(filePath));
      this.watcher.on('add', (filePath) => this.handleViewChange(filePath));
      this.watcher.on('unlink', (filePath) => this.handleViewChange(filePath));
    }
    
    // Watch scripts directory
    if (this.atx.config.scriptsDir) {
      const scriptsWatcher = chokidar.watch(this.atx.config.scriptsDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      
      scriptsWatcher.on('change', (filePath) => this.handleScriptChange(filePath));
      scriptsWatcher.on('add', (filePath) => this.handleScriptChange(filePath));
      scriptsWatcher.on('unlink', (filePath) => this.handleScriptChange(filePath));
    }
    
    // Watch styles directory
    if (this.atx.config.stylesDir) {
      const stylesWatcher = chokidar.watch(this.atx.config.stylesDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      
      stylesWatcher.on('change', (filePath) => this.handleStyleChange(filePath));
      stylesWatcher.on('add', (filePath) => this.handleStyleChange(filePath));
      stylesWatcher.on('unlink', (filePath) => this.handleStyleChange(filePath));
    }
    
    // Watch assets directory
    if (this.atx.config.assets) {
      const assetsWatcher = chokidar.watch(this.atx.config.assets, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      
      assetsWatcher.on('change', (filePath) => this.handleAssetChange(filePath));
      assetsWatcher.on('add', (filePath) => this.handleAssetChange(filePath));
      assetsWatcher.on('unlink', (filePath) => this.handleAssetChange(filePath));
    }
    
    console.log('✅ Smart watcher started');
  }
  
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isWatching = false;
    console.log('🛑 Smart watcher stopped');
  }
  
  // Debounced rebuild to avoid multiple rapid rebuilds
  scheduleRebuild(type, filePath) {
    clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      this.rebuild(type, filePath);
    }, 100); // 100ms debounce
  }
  
  async rebuild(type, filePath) {
    const startTime = Date.now();
    console.log(`🔄 Rebuilding due to ${type} change: ${path.basename(filePath)}`);
    
    try {
      // Only rebuild what's necessary based on what changed
      switch (type) {
        case 'view':
          await this.rebuildViews();
          break;
        case 'script':
          await this.rebuildScripts();
          break;
        case 'style':
          await this.rebuildStyles();
          break;
        case 'asset':
          await this.rebuildAssets();
          break;
      }
      
      this.cache.markBuilt();
      const buildTime = Date.now() - startTime;
      console.log(`✅ Incremental rebuild completed in ${buildTime}ms`);
      
    } catch (err) {
      console.error(`❌ Incremental rebuild failed:`, err);
    }
  }
  
  async rebuildViews() {
    // Only rebuild views that changed
    const views = this.atx.config.views;
    if (!views) return;
    
    // Get list of view files
    const viewFiles = this.getViewFiles(views);
    const changedViews = this.cache.getChangedFiles(viewFiles);
    
    if (changedViews.length === 0) {
      console.log('   No view changes detected');
      return;
    }
    
    console.log(`   Rebuilding ${changedViews.length} changed views`);
    
    // Process only changed views
    const changedViewData = {};
    for (const viewFile of changedViews) {
      // This is a simplified rebuild - in practice you'd want more granular processing
      const viewName = path.basename(viewFile, path.extname(viewFile));
      changedViewData[viewName] = this.atx.views[viewName];
    }
    
    // Render and write only changed views
    const rendered = await this.atx.config.compiler(changedViewData, this.atx.data);
    // Write changed files...
  }
  
  async rebuildScripts() {
    if (!this.atx.config.scripts) return;
    console.log('   Rebuilding scripts...');
    // Rebuild scripts...
  }
  
  async rebuildStyles() {
    if (!this.atx.config.styles) return;
    console.log('   Rebuilding styles...');
    // Rebuild styles...
  }
  
  async rebuildAssets() {
    if (!this.atx.config.assets) return;
    console.log('   Rebuilding assets...');
    // Rebuild assets...
  }
  
  getViewFiles(viewsDir) {
    // Get all view files recursively
    const files = [];
    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (path.extname(item) === '.html') {
            files.push(fullPath);
          }
        }
      } catch (err) {
        // Ignore errors
      }
    };
    
    scanDir(viewsDir);
    return files;
  }
  
  handleViewChange(filePath) {
    this.scheduleRebuild('view', filePath);
  }
  
  handleScriptChange(filePath) {
    this.scheduleRebuild('script', filePath);
  }
  
  handleStyleChange(filePath) {
    this.scheduleRebuild('style', filePath);
  }
  
  handleAssetChange(filePath) {
    this.scheduleRebuild('asset', filePath);
  }
}
