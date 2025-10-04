import { ServiceProvider } from '@brickworks/engine';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';

export class ClovieConfig extends ServiceProvider {
  static manifest = {
    name: 'Clovie Config',
    namespace: 'clovieConfig',
    version: '1.0.0'
  };
  #ready = false;
  #discoveredConfig = null;
  #configFilePath = null;
  #readyCallbacks = new Set();
  #reloadCallbacks = new Set();

  async initialize(useContext, config) {
    try {
      const relay = useContext('relay');
      if (config.configPath) {
        this.#configFilePath = config.configPath;
        this.#discoveredConfig = await this.#importConfig(this.#configFilePath);
        relay?.broadcast('ready', this.#discoveredConfig);
        this.#callCallbacks('ready', this.#discoveredConfig);
        this.#ready = true;

        chokidar.watch(config.configPath).on('change', async () => {
          this.#discoveredConfig = await this.#importConfig(this.#configFilePath);
          relay?.broadcast('reload', this.#discoveredConfig);
          this.#callCallbacks('reload', this.#discoveredConfig);
        });
      }
    } catch (err) {
      console.error('❌ Error initializing Clovie Config:', err);
      throw err;
    }
  }

  actions() {
    return {
      onReady: (callback) => {
        if (this.#ready) {
          callback(this.#discoveredConfig);
        }
        this.#readyCallbacks.add(callback);
        return () => this.#readyCallbacks.delete(callback);
      },
      onReload: (callback) => {
        this.#reloadCallbacks.add(callback);
        return () => this.#reloadCallbacks.delete(callback);
      },
      /**
       * Get the discovered configuration
       */
      get: (key) => {
        return key ? this.#discoveredConfig?.[key] : this.#discoveredConfig;
      },

      /**
       * Check if a config value exists
       */
      has: (key) => {
        return this.#discoveredConfig && key in this.#discoveredConfig;
      },

      /**
       * Get all discovered paths for file watching
       */
      getWatchPaths: () => {
        if (!this.#discoveredConfig) return [];
        
        const watchPaths = [
          this.#discoveredConfig.views,
          this.#discoveredConfig.partials,
          this.#discoveredConfig.styles,
          this.#discoveredConfig.scripts,
          this.#discoveredConfig.assets,
        ].filter(Boolean);

        // Add route template paths
        if (this.#discoveredConfig.routes && Array.isArray(this.#discoveredConfig.routes)) {
          for (const route of this.#discoveredConfig.routes) {
            if (route.template) {
              // Resolve template path relative to config file or cwd
              const templatePath = path.isAbsolute(route.template) 
                ? route.template 
                : path.resolve(process.cwd(), route.template);
              
              if (fs.existsSync(templatePath)) {
                watchPaths.push(templatePath);
              }
            }
          }
        }

        // Add config file itself if available
        if (this.#configFilePath && fs.existsSync(this.#configFilePath)) {
          watchPaths.push(this.#configFilePath);
        }
        
        return watchPaths;
      },

      /**
       * Check if a path is the config file
       */
      isConfigFile: (filePath) => {
        return this.#configFilePath && path.resolve(filePath) === path.resolve(this.#configFilePath);
      },

      /**
       * Set config file path for watching
       */
      setConfigFilePath: (filePath) => {
        this.#configFilePath = filePath;
      }
    };
  }

  #callCallbacks(type, config) {
    switch (type) {
      case 'ready':
        for (const callback of this.#readyCallbacks) {
          callback(config);
        }
        break;
      case 'reload':
        for (const callback of this.#reloadCallbacks) {
          callback(config);
        }
        break;
    }
  }

  async #importConfig(path) {
    const configModule = await import(`${path}?t=${Date.now()}`);
    const config = configModule.default || configModule;
    await this.#resolveData(config.data);
    return await this.#discoverProjectStructure(config);
  }

  async #discoverProjectStructure(config) {
    const cwd = process.cwd();
    const discovered = { ...config };
  
    // Handle legacy config key mappings
    if (!discovered.templateCompiler && discovered.compiler) {
      discovered.templateCompiler = discovered.compiler;
    }
    
    if (!discovered.templateRegister && discovered.register) {
      discovered.templateRegister = discovered.register;
    }

    // Normalize provided paths first
    if (discovered.views) {
      discovered.views = this.#normalizePath(discovered.views);
    }
    if (discovered.scripts) {
      discovered.scripts = this.#normalizePath(discovered.scripts);
    }
    if (discovered.styles) {
      discovered.styles = this.#normalizePath(discovered.styles);
    }
    if (discovered.partials) {
      discovered.partials = this.#normalizePath(discovered.partials);
    }
    if (discovered.assets) {
      discovered.assets = this.#normalizePath(discovered.assets);
    }
    if (discovered.data && typeof discovered.data === 'string' && 
        (discovered.data.endsWith('.json') || discovered.data.endsWith('.js'))) {
      // Only normalize if it looks like a data file
      discovered.data = this.#normalizePath(discovered.data);
    }
  
    // Basic directory auto-detection with proper path normalization
    if (!discovered.views) {
      const viewDirs = ['views', 'templates', 'pages'];
      for (const dir of viewDirs) {
        if (fs.existsSync(path.join(cwd, dir))) {
          discovered.views = this.#normalizePath(dir);
          break;
        }
      }
    }
    
    if (!discovered.scripts) {
      const scriptDirs = ['scripts', 'js'];
      for (const dir of scriptDirs) {
        if (fs.existsSync(path.join(cwd, dir))) {
          discovered.scripts = this.#normalizePath(dir);
          break;
        }
      }
    }
    
    if (!discovered.styles) {
      const styleDirs = ['styles', 'css'];
      for (const dir of styleDirs) {
        if (fs.existsSync(path.join(cwd, dir))) {
          discovered.styles = this.#normalizePath(dir);
          break;
        }
      }
    }
    
    if (!discovered.partials) {
      const partialDirs = ['partials', 'components'];
      for (const dir of partialDirs) {
        if (fs.existsSync(path.join(cwd, dir))) {
          discovered.partials = this.#normalizePath(dir);
          break;
        }
      }
    }
    
    if (!discovered.assets) {
      const assetDirs = ['assets', 'public', 'static'];
      for (const dir of assetDirs) {
        if (fs.existsSync(path.join(cwd, dir))) {
          discovered.assets = this.#normalizePath(dir);
          break;
        }
      }
    }
    
    // Basic config fallbacks
    if (discovered.watch === undefined) {
      discovered.watch = discovered.mode === 'development' || process.env.NODE_ENV === 'development';
    }
  
    if (!discovered.port && discovered.watch) {
      discovered.port = 3000;
    }
  
    if (!discovered.outputDir) {
      discovered.outputDir = './dist';
    }
  
    if (!discovered.data) {
      const dataFiles = ['data.json', 'data.js'];
      for (const file of dataFiles) {
        if (fs.existsSync(path.join(cwd, file))) {
          discovered.data = this.#normalizePath(file);
          break;
        }
      }
    }
  
    // Fallback to Handlebars if no template compiler is provided
    if (!discovered.templateCompiler) {
      try {
        const Handlebars = await import('handlebars');
        discovered.templateCompiler = (template, data) => {
          try {
            const compiled = Handlebars.default.compile(template);
            return compiled(data);
          } catch (err) {
            console.warn(`⚠️  Template compilation error: ${err.message}`);
            return template;
          }
        };
        discovered.templateRegister = (name, template) => {
          Handlebars.default.registerPartial(name, template);
        };
      } catch (err) {
        console.warn('⚠️  Handlebars not available. Install with: npm install handlebars');
        // Explicitly set to undefined to ensure tests pass
        discovered.templateCompiler = undefined;
        discovered.templateRegister = undefined;
      }
    }
  
    // Fallback to Sass if no style compiler is provided
    if (!discovered.styleCompiler) {
      try {
        const sass = await import('sass');
        discovered.styleCompiler = async (content, filePath) => {
          try {
            const result = sass.default.compileString(content, {
              style: 'expanded',
              sourceMap: false
            });
            return result.css;
          } catch (err) {
            // If Sass compilation fails, try to return as CSS
            console.warn(`⚠️  Style compilation error in ${filePath}: ${err.message}`);
            return content;
          }
        };
      } catch (err) {
        // If Sass isn't available, fallback to CSS pass-through
        console.warn('⚠️  Sass not available. Install with: npm install sass');
        discovered.styleCompiler = async (content, filePath) => content;
      }
    }
  
    // Fallback to esbuild if no script compiler is provided
    if (!discovered.scriptCompiler) {
      try {
        const esbuild = await import('esbuild');
        discovered.scriptCompiler = async (content, filePath) => {
          try {
            const result = await esbuild.build({
              stdin: {
                contents: content,
                resolveDir: path.dirname(filePath),
              },
              bundle: true,
              format: 'iife',
              target: 'es2015',
              minify: discovered.mode === 'production',
              sourcemap: discovered.mode === 'development',
              write: false,
            });
            return result.outputFiles[0].text;
          } catch (err) {
            console.warn(`⚠️  Script compilation error in ${filePath}: ${err.message}`);
            return content;
          }
        };
      } catch (err) {
        // If esbuild isn't available, fallback to JS pass-through
        console.warn('⚠️  esbuild not available. Install with: npm install esbuild');
        discovered.scriptCompiler = async (content, filePath) => content;
      }
    }
  
    // Basic package manager detection
    if (!discovered.packageManager) {
      if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
        discovered.packageManager = 'npm';
      } else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
        discovered.packageManager = 'yarn';
      } else if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
        discovered.packageManager = 'pnpm';
      }
    }
  
    // Development mode detection
    if (discovered.mode === undefined) {
      discovered.mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    }
  
    // Cache directory fallback
    if (!discovered.cacheDir) {
      discovered.cacheDir = path.join(discovered.outputDir, '.cache');
    }
  
    // Warn if no views directory
    if (!discovered.views) {
      console.warn('⚠️  No views directory found. Create a views/ folder with your templates.');
    }
    
    return discovered;
  }

  /**
   * Normalize path to ensure it starts with ./ for relative paths
   */
  #normalizePath(inputPath) {
    if (!inputPath) return inputPath;
    
    // If it's already absolute, return as is
    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }
    
    // If it starts with ./ or ../, return as is
    if (inputPath.startsWith('./') || inputPath.startsWith('../')) {
      return inputPath;
    }
    
    // Otherwise, add ./ prefix
    return `./${inputPath}`;
  }

  /**
   * Resolve data before calling onReady listeners
   * This resolves data upfront as global data for the entire app
   */
  async #resolveData(data) {
    const stable = this.useContext('stable');
    if (!data) return;

    try {
      if (typeof data === 'function') {
        // Execute data function to get global data
        const resolvedData = await data();
        stable.set(['data'], resolvedData);
      } else if (data instanceof Promise) {
        // Wait for promise to resolve
        const resolvedData = await data;
        stable.set(['data'], resolvedData);
        console.log('📊 Resolved data promise to global data');
      } else if (typeof data === 'string') {
        // Load data from file
        const dataPath = path.resolve(process.cwd(), data);
        if (fs.existsSync(dataPath)) {
          try {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            if (data.endsWith('.json') && fileContent) {
              stable.set(['data'], JSON.parse(fileContent));
              console.log('📊 Loaded JSON data file');
            } else if (data.endsWith('.js')) {
              // For JS files, we'd need to evaluate them
              // For now, just keep the path
              console.log('📊 JS data files not yet supported, keeping path');
            }
          } catch (err) {
            console.warn(`⚠️  Could not load data file ${data}:`, err.message);
            // Keep the original path on error
          }
        }
      }
      // If it's already an object, leave it as is
      
      if (typeof data === 'object' && data !== null) {
        stable.set(['data'], data);
        console.log(`📊 Global data loaded with ${Object.keys(data).length} properties`);
      }
    } catch (err) {
      console.error('❌ Error resolving data:', err);
      // Keep original data on error
    }
  }
}
