import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { BuildCache } from './cache.js';

export class SmartWatcher {
  constructor(clovieInstance) {
    this.clovie = clovieInstance;
    this.watchers = [];
    this.cache = new BuildCache(clovieInstance.config.outputDir);
    this.debounceTimer = null;
    this.isWatching = false;
  }
  
  start() {
    if (this.isWatching) return;
    
    console.log('👀 Starting smart file watcher...');
    this.isWatching = true;
    
    // Watch views directory
    if (this.clovie.config.views) {
      const viewsWatcher = chokidar.watch(this.clovie.config.views, {
        ignored: /(^|[\/\\])\../, // Ignore hidden files
        persistent: true
      });
      
      viewsWatcher.on('change', (filePath) => this.handleViewChange(filePath));
      viewsWatcher.on('add', (filePath) => this.handleViewChange(filePath));
      viewsWatcher.on('unlink', (filePath) => this.handleViewChange(filePath));
      this.watchers.push(viewsWatcher);
    }

    // Watch partials directory
    if (this.clovie.config.partials) {
      const partialsWatcher = chokidar.watch(this.clovie.config.partials, {
        ignored: /(^|[\/\\])\../, // Ignore hidden files
        persistent: true
      });
      
      partialsWatcher.on('change', (filePath) => this.handlePartialChange(filePath));
      partialsWatcher.on('add', (filePath) => this.handlePartialChange(filePath));
      partialsWatcher.on('unlink', (filePath) => this.handlePartialChange(filePath));
      this.watchers.push(partialsWatcher);
    }
    
    // Watch scripts directory
    if (this.clovie.config.scriptsDir) {
      const scriptsWatcher = chokidar.watch(this.clovie.config.scriptsDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      
      scriptsWatcher.on('change', (filePath) => this.handleScriptChange(filePath));
      scriptsWatcher.on('add', (filePath) => this.handleScriptChange(filePath));
      scriptsWatcher.on('unlink', (filePath) => this.handleScriptChange(filePath));
      this.watchers.push(scriptsWatcher);
    }
    
    // Watch styles directory
    if (this.clovie.config.stylesDir) {
      const stylesWatcher = chokidar.watch(this.clovie.config.stylesDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      
      stylesWatcher.on('change', (filePath) => this.handleStyleChange(filePath));
      stylesWatcher.on('add', (filePath) => this.handleStyleChange(filePath));
      stylesWatcher.on('unlink', (filePath) => this.handleStyleChange(filePath));
      this.watchers.push(stylesWatcher);
    }
    
    // Watch assets directory
    if (this.clovie.config.assets) {
      const assetsWatcher = chokidar.watch(this.clovie.config.assets, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      
      assetsWatcher.on('change', (filePath) => this.handleAssetChange(filePath));
      assetsWatcher.on('add', (filePath) => this.handleAssetChange(filePath));
      assetsWatcher.on('unlink', (filePath) => this.handleAssetChange(filePath));
      this.watchers.push(assetsWatcher);
    }
    
    console.log('✅ Smart watcher started');
  }
  
  stop() {
    this.watchers.forEach(watcher => {
      watcher.close();
    });
    this.watchers = [];
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
        case 'partial':
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
      
      // Trigger live reload if callback is set
      if (this.onRebuild) {
        this.onRebuild();
      }
      
    } catch (err) {
      console.error(`❌ Incremental rebuild failed:`, err);
    }
  }
  
  async rebuildViews() {
    // For now, just trigger a full rebuild of views since incremental is complex
    console.log('   Triggering full view rebuild...');
    
    try {
      // Re-process all views
      const getViews = await import('./getViews.js');
      const viewsResult = getViews.default(this.clovie.config.views, this.clovie.config.models, this.clovie.data, this.clovie.config.partials);
      this.clovie.views = viewsResult.pages;
      this.clovie.partials = viewsResult.partials;
      
      // Convert to the format expected by render (same as main build process)
      this.clovie.processedViews = {};
      for (const [key, value] of Object.entries(this.clovie.views)) {
        if (value && value.template) {
          // Use filename from model processing, or generate default
          const fileName = value.filename || key.replace(/\.[^/.]+$/, '.html');
          this.clovie.processedViews[fileName] = value;
        }
      }
      
      // Re-render all views using the render function
      const render = await import('./render.js');
      this.clovie.rendered = await render.default(
        this.clovie.processedViews, 
        this.clovie.config.compiler, 
        Object.keys(this.clovie.processedViews), 
        this.clovie.isDevMode,
        this.clovie.partials,
        this.clovie.config.register
      );
      
      // Write the updated views
      const write = await import('./write.js');
      write.default(this.clovie.rendered, this.clovie.config.outputDir);
      
      console.log('   Views rebuilt successfully');
    } catch (err) {
      console.error('   View rebuild failed:', err);
      throw err;
    }
  }
  
  async rebuildScripts() {
    if (!this.clovie.config.scripts) return;
    console.log('   Rebuilding scripts...');
    
    try {
      const bundler = await import('./bundler.js');
      this.clovie.scripts = await bundler.default(this.clovie.config.scripts);
      
      const write = await import('./write.js');
      write.default(this.clovie.scripts, this.clovie.config.outputDir);
      
      console.log('   Scripts rebuilt successfully');
    } catch (err) {
      console.error('   Script rebuild failed:', err);
      throw err;
    }
  }
  
  async rebuildStyles() {
    if (!this.clovie.config.styles) return;
    console.log('   Rebuilding styles...');
    
    try {
      const getStyles = await import('./getStyles.js');
      this.clovie.styles = getStyles.default(this.clovie.config.styles);
      
      const write = await import('./write.js');
      write.default(this.clovie.styles, this.clovie.config.outputDir);
      
      console.log('   Styles rebuilt successfully');
    } catch (err) {
      console.error('   Style rebuild failed:', err);
      throw err;
    }
  }
  
  async rebuildAssets() {
    if (!this.clovie.config.assets) return;
    console.log('   Rebuilding assets...');
    
    try {
      const getAssets = await import('./getAssets.js');
      this.clovie.assets = getAssets.default(this.clovie.config.assets);
      
      const write = await import('./write.js');
      write.default(this.clovie.assets, this.clovie.config.outputDir);
      
      console.log('   Assets rebuilt successfully');
    } catch (err) {
      console.error('   Asset rebuild failed:', err);
      throw err;
    }
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

  handlePartialChange(filePath) {
    this.scheduleRebuild('partial', filePath);
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
