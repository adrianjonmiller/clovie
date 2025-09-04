import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import bundler from './bundler.js';
import getAssets from './getAssets.js';
import getData from './getData.js';
import getStyles from './getStyles.js';
import getViews from './getViews.js';
import render from './render.js';
import write from './write.js';
import clean from '../utils/clean.js';
import defaultConfig from '../../config/default.config.js';
import { discoverProjectStructure } from './discover.js';
import { SmartWatcher } from './watcher.js';
import { DevServer } from './server.js';

export default class Clovie {
  constructor (config) {
    // Merge with defaults and auto-discover project structure
    this.config = discoverProjectStructure(Object.assign(defaultConfig, config));
    
    // Set derived paths
    if (this.config.styles) {
      this.config.stylesDir = path.resolve(path.dirname(this.config.styles));
    }
    if (this.config.scripts) {
      this.config.scriptsDir = path.resolve(path.dirname(this.config.scripts));
    }
    
    this.errorCb = null;
    
    // Initialize smart watcher
    this.watcher = new SmartWatcher(this);
    
    // Log configuration summary
    console.log('📁 Clovie Configuration:');
    console.log(`   Views: ${this.config.views || 'Not found'}`);
    console.log(`   Scripts: ${this.config.scripts || 'Not found'}`);
    console.log(`   Styles: ${this.config.styles || 'Not found'}`);
    console.log(`   Assets: ${this.config.assets || 'Not found'}`);
    console.log(`   Output: ${this.config.outputDir}`);
  }

  async startWatch() {
    try {
      console.log('🚀 Starting development server with smart watching...');
      
      // Do initial build
      console.log('📦 Building initial site...');
      await this.build();
      
      // Start development server
      console.log('🌐 Starting development server...');
      this.devServer = new DevServer(this, this.config.port || 3000);
      this.devServer.start();
      
      // Start smart watcher
      console.log('👀 Starting smart watcher...');
      this.watcher.start();
      
      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        this.watcher.stop();
        if (this.devServer) {
          this.devServer.stop();
        }
        process.exit(0);
      });
      
      console.log('✅ Development server running. Press Ctrl+C to stop.');
    } catch (err) {
      console.error('❌ Failed to start watch mode:', err);
      throw err;
    }
  }

  async build () {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting build...');
      
      // Clean output directory
      console.log('🧹 Cleaning output directory...');
      clean(this.config.outputDir);

      // Load data
      console.log('📊 Loading data...');
      this.data = this.config.data ? await getData(this.config.data) : {};
      console.log(`   Loaded ${Object.keys(this.data).length} data sources`);
      
      // Process views
      console.log('📝 Processing views...');
      this.views = getViews(this.config.views, this.config.models, this.data);
      
      // Convert to the format expected by render
      this.processedViews = {};
      for (const [key, value] of Object.entries(this.views)) {
        if (value && value.template) {
          // Use filename from model processing, or generate default
          const fileName = value.filename || key.replace(/\.[^/.]+$/, '.html');
          this.processedViews[fileName] = value;
        }
      }
      console.log(`   Processed ${Object.keys(this.processedViews).length} views`);
      
      // Render templates
      console.log('🎨 Rendering templates...');
      this.rendered = await render(this.processedViews, this.config.compiler, Object.keys(this.processedViews));
      console.log(`   Rendered ${Object.keys(this.rendered).length} templates`);
      
      // Process assets in parallel for speed
      const assetPromises = [];
      
      if (this.config.scripts) {
        console.log('⚡ Bundling scripts...');
        assetPromises.push(
          bundler(this.config.scripts).then(scripts => {
            this.scripts = scripts;
            console.log(`   Bundled ${Object.keys(scripts).length} script files`);
          })
        );
      }
      
      if (this.config.styles) {
        console.log('🎨 Compiling styles...');
        assetPromises.push(
          Promise.resolve().then(() => {
            this.styles = getStyles(this.config.styles);
            console.log(`   Compiled ${Object.keys(this.styles).length} style files`);
          })
        );
      }
      
      if (this.config.assets) {
        console.log('📦 Processing assets...');
        assetPromises.push(
          Promise.resolve().then(() => {
            this.assets = getAssets(this.config.assets);
            console.log(`   Processed ${Object.keys(this.assets).length} asset files`);
          })
        );
      }
      
      // Wait for all assets to complete
      if (assetPromises.length > 0) {
        await Promise.all(assetPromises);
      }
      
      // Write output
      console.log('💾 Writing files...');
      this.cache = write(Object.assign(this.rendered, this.scripts, this.styles, this.assets), this.config.outputDir);
      
      const buildTime = Date.now() - startTime;
      console.log(`✅ Build completed in ${buildTime}ms`);
      
      return this.cache;
    } catch (err) {
      const buildTime = Date.now() - startTime;
      console.error(`❌ Build failed after ${buildTime}ms:`, err);
      
      // Provide better error context
      if (err.code === 'ENOENT') {
        console.error('💡 Tip: Check that all referenced files and directories exist');
      } else if (err.message?.includes('template')) {
        console.error('💡 Tip: Verify your template syntax and data structure');
      }
      
      if (this.errorCb) {
        this.errorCb(err);
      } else {
        throw err;
      }
    }
  }

  watch () {
    try {
      bs.init({
        watch: true,
        server: {
          baseDir: this.config.outputDir,
          serveStaticOptions: {
              extensions: ["html", 'htm']
          }
        }
      });

      let options = {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true
      };

      chokidar.watch(this.config.views, options).on('all', () => {
        process.nextTick(async () => {
          try {
            console.log('Recompile Templates');
            this.views = getViews(this.config.views, this.config.models, this.data);
            this.urls = Object.keys(this.views);
            this.rendered = await render(this.views, this.config.compiler, this.urls);
            this.cache = write(this.rendered, this.config.outputDir, Object.keys(this.rendered), this.cache);
            console.log('Templates Done');
          } catch (err) {
            console.error('Template recompilation failed:', err);
          }
        })
      });

      chokidar.watch(this.config.scriptsDir, options).on('all', () => {
        process.nextTick(async () => {
          try {
            console.log('Recompile Scripts');
            this.scripts = await bundler(this.config.scripts);
            this.cache = write(this.scripts, this.config.outputDir, Object.keys(this.scripts), this.cache);
            console.log('Scripts Done');
          } catch (err) {
            console.error('Script recompilation failed:', err);
          }
        })
      });

      chokidar.watch(this.config.stylesDir, options).on('all', () => {
        process.nextTick(() => {
          try {
            console.log('Updates styles');
            this.styles = getStyles(this.config.styles);
            this.cache = write(this.styles, this.config.outputDir, Object.keys(this.styles), this.cache);
            console.log('Styles Done');
          } catch (err) {
            console.error('Style update failed:', err);
          }
        });
      });

      chokidar.watch(this.config.assets, options).on('all', () => {
        process.nextTick(() => {
          try {
            console.log('Updating assets');
            this.assets = getAssets(this.config.assets);
            this.cache = write(this.assets, this.config.outputDir, Object.keys(this.assets), this.cache);
            console.log('Assets updated');
          } catch (err) {
            console.error('Asset update failed:', err);
          }
        });
      });
    } catch (err) {
      this.error(err)
    }
  }

  error(cb) {
    this.errorCb = cb
  }
}

