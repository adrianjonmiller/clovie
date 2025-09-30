import { ServiceProvider } from '@brickworks/engine';
import path from 'path';
import clean from './utils/clean.js';
import { Cache } from './Cache.js';
import { Routes } from './Routes.js';

export class Build extends ServiceProvider {
  static manifest = {
    name: 'Clovie Build',
    namespace: 'build',
    version: '1.0.0',
    dependencies: [Cache, Routes]
  };

  initialize(useContext, config) {
    this.#config = config;
  }

  #config;

  actions(useContext) {
    return {
      static: async () => {
        const { routes, compiler, file, state, cache } = useContext();
        const startTime = Date.now();
        
        try {
          console.log('🚀 Starting static build...');
          
          // Check for incremental build
          const buildStats = cache.getBuildStats();
          const isIncremental = buildStats.totalBuilds > 0;
          
          if (isIncremental) {
            console.log('🔄 Incremental build detected');
          }
          
          // Clean output directory (only if not incremental)
          if (!isIncremental) {
            console.log('🧹 Cleaning output directory...');
            clean(this.#config.outputDir);
          }
          
          // Load data into state
          console.log('📊 Loading data...');
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
          
          // Generate routes (converts views + configured routes to unified route system)
          console.log('🛣️  Generating routes...');
          const allRoutes = await routes.generateRoutes();
          
          // Process routes to generate pages
          console.log('📝 Processing routes...');
          const routesResult = await routes.processRoutes(allRoutes);
          
          // Compile templates
          console.log('🎨 Compiling templates...');
          const compiled = await compiler.templates(routesResult.pages, routesResult.partials);
          
          // Write files
          console.log('💾 Writing files...');
          file.write(compiled, this.#config.outputDir);
          
          // Process assets
          console.log('⚡ Processing assets...');
          const assetPromises = [];
          
          // Process scripts
          if (this.#config.scripts) {
            console.log('⚡ Compiling scripts...');
            assetPromises.push(
              (async () => {
                const scriptFiles = file.readNames(this.#config.scripts);
                const scripts = {};
                
                for (const filePath of scriptFiles) {
                  const content = file.readFile(filePath);
                  if (content) {
                    const fileName = path.basename(filePath);
                    
                    if (this.#config.scriptCompiler) {
                      try {
                        console.log(`🔧 Using configured script compiler for: ${filePath}`);
                        // Use the configured script compiler
                        const compiled = await this.#config.scriptCompiler(content, filePath);
                        scripts[fileName] = compiled;
                        console.log(`✅ Script compiled successfully: ${fileName}`);
                      } catch (err) {
                        console.warn(`⚠️  Script compilation failed for ${filePath}: ${err.message}`);
                        // Fallback to raw content
                        scripts[fileName] = content;
                      }
                    } else {
                      console.log(`⚠️  No script compiler configured, copying raw file: ${fileName}`);
                      // No script compiler configured, just copy the file
                      scripts[fileName] = content;
                    }
                  }
                }
                
                file.write(scripts, this.#config.outputDir);
                console.log(`   Compiled ${Object.keys(scripts).length} script files`);
              })()
            );
          }
          
          // Process styles
          if (this.#config.styles) {
            console.log('🎨 Compiling styles...');
            assetPromises.push(
              (async () => {
                // Use configurable style compiler
                const styleFiles = file.readNames(this.#config.styles);
                const styles = {};
                
                for (const filePath of styleFiles) {
                  const content = file.readFile(filePath);
                  if (content) {
                    const fileName = path.basename(filePath).replace(/\.(scss|sass|less|styl)$/, '.css');
                    
                    if (this.#config.styleCompiler) {
                      try {
                        // Use the configured style compiler
                        const compiled = await this.#config.styleCompiler(content, filePath);
                        styles[fileName] = compiled;
                      } catch (err) {
                        console.warn(`⚠️  Style compilation failed for ${filePath}: ${err.message}`);
                        // Fallback to raw content
                        styles[fileName] = content;
                      }
                    } else {
                      // No style compiler configured, just copy the file
                      styles[fileName] = content;
                    }
                  }
                }
                
                file.write(styles, this.#config.outputDir);
                console.log(`   Compiled ${Object.keys(styles).length} style files`);
              })()
            );
          }
          
          // Process assets
          if (this.#config.assets) {
            console.log('📁 Copying assets...');
            assetPromises.push(
              (async () => {
                // Copy asset files
                const assetFiles = file.readNames(this.#config.assets);
                const assets = {};
                
                for (const filePath of assetFiles) {
                  const content = file.readFile(filePath);
                  if (content) {
                    const relativePath = path.relative(this.#config.assets, filePath);
                    assets[relativePath] = content;
                  }
                }
                
                file.write(assets, this.#config.outputDir);
                console.log(`   Copied ${Object.keys(assets).length} asset files`);
              })()
            );
          }
          
          await Promise.all(assetPromises);
          
          // Mark build as complete
          cache.markBuilt();
          
          const buildTime = Date.now() - startTime;
          const finalStats = cache.getBuildStats();
          
          console.log(`✅ Static build completed in ${buildTime}ms`);
          console.log(`📊 Build stats: ${finalStats.totalBuilds} total builds, ${finalStats.changedFiles} files changed`);
          
          return {
            success: true,
            buildTime,
            filesGenerated: Object.keys(compiled).length,
            isIncremental,
            changedFiles: finalStats.changedFiles
          };
          
        } catch (err) {
          console.error('❌ Build failed:', err);
          throw err;
        }
      }
    };
  }

}
