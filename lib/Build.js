import { ServiceProvider } from '@brickworks/engine';
import path from 'path';
import clean from './utils/clean.js';

export class Build extends ServiceProvider {
  static manifest = {
    name: 'Clovie Build',
    namespace: 'build',
    version: '1.0.0'
  };

  initialize(useContext, config) {
    this.#config = config;
  }

  #config;

  actions(useContext) {
    const { views, compiler, file, state } = useContext();
    
    return {
      static: async () => {
        const startTime = Date.now();
        
        try {
          console.log('🚀 Starting static build...');
          
          // Clean output directory
          console.log('🧹 Cleaning output directory...');
          clean(this.#config.outputDir);
          
          // Load data into state
          console.log('📊 Loading data...');
          const loadedData = await this.#loadData(state);
          
          // Process views
          console.log('📝 Processing views...');
          const viewsResult = await views.process(this.#config.views, this.#config.partials, loadedData);
          
          // Compile templates
          console.log('🎨 Compiling templates...');
          const compiled = await compiler.templates(viewsResult.pages, viewsResult.partials);
          
          // Write files
          console.log('💾 Writing files...');
          file.write(compiled, this.#config.outputDir);
          
          // Process assets
          await this.#processAssets(file);
          
          const buildTime = Date.now() - startTime;
          console.log(`✅ Static build completed in ${buildTime}ms`);
          
          return {
            success: true,
            buildTime,
            filesGenerated: Object.keys(compiled).length
          };
          
        } catch (err) {
          console.error('❌ Build failed:', err);
          throw err;
        }
      }
    };
  }

  async #loadData(state) {
    let loadedData = {};
    
    if (this.#config.data) {
      // Load data into state for reactive system
      if (typeof this.#config.data === 'function') {
        loadedData = await this.#config.data();
        state.load(loadedData);
      } else if (typeof this.#config.data === 'object') {
        loadedData = this.#config.data;
        state.load(loadedData);
      }
      
      console.log(`   Loaded ${Object.keys(loadedData).length} data sources into reactive state`);
    }
    
    return loadedData;
  }

  async #processAssets(fileService) {
    const assetPromises = [];
    
    // Process scripts
    if (this.#config.scripts) {
      console.log('⚡ Bundling scripts...');
      assetPromises.push(
        this.#bundleScripts(fileService).then(scripts => {
          fileService.write(scripts, this.#config.outputDir);
          console.log(`   Bundled ${Object.keys(scripts).length} script files`);
        })
      );
    }
    
    // Process styles
    if (this.#config.styles) {
      console.log('🎨 Compiling styles...');
      assetPromises.push(
        this.#compileStyles(fileService).then(styles => {
          fileService.write(styles, this.#config.outputDir);
          console.log(`   Compiled ${Object.keys(styles).length} style files`);
        })
      );
    }
    
    // Process assets
    if (this.#config.assets) {
      console.log('📁 Copying assets...');
      assetPromises.push(
        this.#copyAssets(fileService).then(assets => {
          fileService.write(assets, this.#config.outputDir);
          console.log(`   Copied ${Object.keys(assets).length} asset files`);
        })
      );
    }
    
    await Promise.all(assetPromises);
  }

  async #bundleScripts(fileService) {
    // Simple script bundling - for now just copy files
    const scriptFiles = fileService.readNames(this.#config.scripts);
    const scripts = {};
    
    for (const file of scriptFiles) {
      const content = fileService.readFile(file);
      if (content) {
        const fileName = path.basename(file);
        scripts[fileName] = content;
      }
    }
    
    return scripts;
  }

  async #compileStyles(fileService) {
    // Use configurable style compiler
    const styleFiles = fileService.readNames(this.#config.styles);
    const styles = {};
    
    for (const file of styleFiles) {
      const content = fileService.readFile(file);
      if (content) {
        const fileName = path.basename(file).replace(/\.(scss|sass|less|styl)$/, '.css');
        
        if (this.#config.styleCompiler) {
          try {
            // Use the configured style compiler
            const compiled = await this.#config.styleCompiler(content, file);
            styles[fileName] = compiled;
          } catch (err) {
            console.warn(`⚠️  Style compilation failed for ${file}: ${err.message}`);
            // Fallback to raw content
            styles[fileName] = content;
          }
        } else {
          // No style compiler configured, just copy the file
          styles[fileName] = content;
        }
      }
    }
    
    return styles;
  }

  async #copyAssets(fileService) {
    // Copy asset files
    const assetFiles = fileService.readNames(this.#config.assets);
    const assets = {};
    
    for (const file of assetFiles) {
      const content = fileService.readFile(file);
      if (content) {
        const relativePath = path.relative(this.#config.assets, file);
        assets[relativePath] = content;
      }
    }
    
    return assets;
  }
}
