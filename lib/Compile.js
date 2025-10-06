import { ServiceProvider } from '@brickworks/engine';
import { createReactor } from '@brickworks/engine/state';
import { progressSink, metricsSink, prettySink } from '@brickworks/engine/logger';
import path from 'path';
import { Cache } from './Cache.js';
import { File } from './File.js';
import { createProgressTracker } from './utils/progress.js';

import { replaceRouteParams } from './utils/routeParams.js';
import { formatOutputPath } from './utils/outputPath.js';

export class Compile extends ServiceProvider {

  static manifest = {
    name: 'Clovie Compile',
    namespace: 'compile',
    version: '1.0.0',
    log: {
      sinks: [progressSink, metricsSink, prettySink]
    },
    dependencies: [Cache, File]
  };

  #config = null;
  #progressTracker = null;
  #pathMap = new Map();

  initialize(useContext, config) {
    this.#config = config;
    const [relay, configurator] = useContext('relay', 'configurator');
    if (configurator) {
      relay.from(configurator).subscribe('config:update', (config) => {
        this.#config = config;
      });
    }
  }

  actions(useContext) {
    const [file, log] = useContext('file', 'log');
    
    // Initialize progress tracker if not already done
    if (!this.#progressTracker) {
      this.#progressTracker = createProgressTracker(log);
    }
    
    return {
      assets: async (assetsDirectory) => {
        assetsDirectory = assetsDirectory || this.#config.assets;
        if (!assetsDirectory) {
          log.debug('No assets directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(assetsDirectory);
        
        if (filePaths.length === 0) {
          log.debug('No assets to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Assets', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            this.#asset(filePath).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: path.basename(filePath) 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Compiled ${filePaths.length} assets`);
        
        return promises;
      },
      scripts: async (scriptsDirectory) => {
        scriptsDirectory = scriptsDirectory || this.#config.scripts;
        if (!scriptsDirectory) {
          log.debug('No scripts directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(scriptsDirectory);
        
        if (filePaths.length === 0) {
          log.debug('No scripts to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Scripts', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            this.#script(filePath).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: path.basename(filePath) 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Compiled ${filePaths.length} scripts`);
        
        return promises;
      },
      styles: async (stylesDirectory) => {
        stylesDirectory = stylesDirectory || this.#config.styles;
        if (!stylesDirectory) {
          log.debug('No styles directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(stylesDirectory);
        
        if (filePaths.length === 0) {
          log.debug('No styles to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Styles', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            this.#style(filePath).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: path.basename(filePath) 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Compiled ${filePaths.length} styles`);
        
        return promises;
      },
      partials: async (partials) => {
        partials = partials || this.#config.partials;
        if (!partials) {
          log.debug('No partials directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(partials);
        
        if (filePaths.length === 0) {
          log.debug('No partials to load');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Loading Partials', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            Promise.resolve(this.#loadPartial(filePath)).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: path.basename(filePath) 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Loaded ${filePaths.length} partials`);
        
        return promises;
      },
      views: async (viewsDirectory, data) => {
        viewsDirectory = viewsDirectory || this.#config.views;
        if (!viewsDirectory) {
          log.debug('No views directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(viewsDirectory);
        
        if (filePaths.length === 0) {
          log.debug('No views to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Views', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            this.#template(filePath, this.#config.data).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: path.basename(filePath) 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Compiled ${filePaths.length} views`);
        
        return promises;
      },

      routes: async (routes) => {
        routes = routes || this.#config.routes || [];
        if (!routes) {
          log.debug('No routes to compile');
          return [];
        }
        
        
        if (routes.length === 0) {
          log.debug('No routes to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Routes', routes.length, 'routes');
        const promises = [];

        for (let i = 0; i < routes.length; i++) {
          const route = routes[i];
          promises.push(
            this.#route(route).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: route.path || 'route' 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Compiled ${routes.length} routes`);
        
        return promises;
      },
      
      asset:    (path) => this.#asset(path),
      script:   (path) => this.#script(path), 
      style:    (path) => this.#style(path),
      partial:  (path) => this.#loadPartial(path),
      template: (path, data) => this.#template(path, data),
      route:    (route) => this.#route(route),
      remove:   (path) => this.#remove(path),
    };
  }

  #remove(sourcePath) {
    const file = this.useContext('file');
    const outputPaths = this.#pathMap.get(sourcePath);
    if (outputPaths) {
      outputPaths.forEach(outputPath => {
        file.delete(outputPath);
      });
    }
  }

  async #route(route, key) {
    const [state, file, liveReload, log] = this.useContext('state', 'file', 'liveReload', 'log');
    const data = createReactor(() => route.data(state, key));
    const relativePath = replaceRouteParams(route.path, data());
    const outputPath = formatOutputPath(relativePath);
    const templateCompiler = this.#config.templateCompiler;
        
    if (templateCompiler) {
      // Get global data from stable storage
      
      // Compile template with data
      const content = file.read(route.template);
      let renderedContent = templateCompiler(content, data);
      
      // Inject live reload script if in development mode
      if (liveReload && renderedContent.includes('</body>')) {
        log.debug('Injecting live reload script');
        renderedContent = await liveReload.injectLiveReloadScript(renderedContent, this.#config);
      }

      log.debug(`Template compiled successfully: ${outputPath}`);

      this.#registerOutputPath(route.template, outputPath);

      return this.#write(outputPath, renderedContent);
    } else {
      log.warn(`No template compiler configured for route: ${route.path}`);
    }
  }

  async #asset(filePath) {
    const [file, log] = this.useContext('file', 'log');
    const content = file.read(filePath);

    if (content) {
      const assetsDir = this.#config.assets;
      
      const absoluteAssetsDir = this.#toAbsolutePath(assetsDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteAssetsDir, absoluteFilePath);
      
      log.debug(`Processing asset: ${filePath}`);
      log.debug(`Asset processed: ${relativePath}`);
      this.#registerOutputPath(filePath, relativePath);
      return this.#write(relativePath, content);
    }
  }

  async #script(filePath) {
    const [file, log] = this.useContext('file', 'log');
    const content = file.read(filePath);

    if (content && this.#config.scriptCompiler && typeof this.#config.scriptCompiler === 'function') {
      const scriptsDir = this.#config.scripts;
      const fileName = path.basename(filePath);
      
      // Ensure both paths are absolute for proper relative calculation
      const absoluteScriptsDir = this.#toAbsolutePath(scriptsDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteScriptsDir, absoluteFilePath);

      try {
        log.debug(`Using configured script compiler for: ${filePath}`);
        const compiled = await this.#config.scriptCompiler(content, filePath);
        log.debug(`Script compiled successfully: ${fileName}`);
        this.#registerOutputPath(filePath, relativePath);
        return this.#write(relativePath, compiled);
      } catch (err) {
        log.warn(`Script compilation failed for ${filePath}: ${err.message}`);  
      }
    }
  }

  async #style(filePath) {
    const [file, log] = this.useContext('file', 'log');
    const content = file.read(filePath);

    if (content && this.#config.styleCompiler && typeof this.#config.styleCompiler === 'function') {
      const stylesDir = this.#config.styles;
      
      // Ensure both paths are absolute for proper relative calculation
      const absoluteStylesDir = this.#toAbsolutePath(stylesDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteStylesDir, absoluteFilePath).replace(/\.(scss|sass|less|styl)$/, '.css');
      const fileName = path.basename(relativePath);

      try {
        log.debug(`Using configured style compiler for: ${filePath}`);
        const compiled = await this.#config.styleCompiler(content, filePath);
        log.debug(`Style compiled successfully: ${fileName}`);
        this.#registerOutputPath(filePath, relativePath);
        return this.#write(relativePath, compiled);
      } catch (err) {
        log.warn(`Style compilation failed for ${filePath}: ${err.message}`);
        this.#write(relativePath, content); // Fallback to raw content
      }
    }
  }

  #loadPartial(filePath) {
    const [file, log] = this.useContext('file', 'log');
    const content = file.read(filePath);

    if (content && this.#config.templateRegister && typeof this.#config.templateRegister === 'function') {
      try {
        const partialsDir = this.#config.partials;
        const relativePath = path.relative(partialsDir, filePath);
        
        // Get the partial name without extension (e.g., 'header.html' -> 'header')
        const partialName = path.parse(relativePath).name;
        
        // Get the template register function
        const templateRegister = this.#config.templateRegister || this.#config.register;

        log.debug(`Registering partial: ${partialName}`);
        templateRegister(partialName, content);
        log.debug(`Registered partial: ${partialName}`);
      } catch (err) {
        log.warn('Could not register partials:', err.message);
      }
    }
  }

  async #template(filePath, data = {}) {
    const [file, liveReload, log] = this.useContext('file', 'liveReload', 'log');
    const content = file.read(filePath);

    if (content && this.#config.templateCompiler && typeof this.#config.templateCompiler === 'function') {
      const fileName = path.basename(filePath);
      const viewsDir = this.#config.views;
      
      // Ensure both paths are absolute for proper relative calculation
      const absoluteViewsDir = this.#toAbsolutePath(viewsDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteViewsDir, absoluteFilePath);
      
      log.debug(`Processing template: ${filePath}`);
      log.debug(`Views dir: ${absoluteViewsDir}`);
      log.debug(`Relative path: ${relativePath}`);
      
      try {
        // Get global data from stable storage
          
        // Compile template with data
        let renderedContent = this.#config.templateCompiler(content, data);
        
        // Inject live reload script if in development mode

        if (liveReload && renderedContent.includes('</body>')) {
          log.debug('Injecting live reload script');
          renderedContent = await liveReload.injectLiveReloadScript(renderedContent, this.#config);
        }

        log.debug(`Template compiled successfully: ${fileName}`);

        this.#registerOutputPath(filePath, relativePath);

        return this.#write(relativePath, renderedContent);
      } catch (err) {
        log.warn(`Template compilation failed for ${filePath}: ${err.message}`);
      }
    }
  }

  /**
   * Convert a path to an absolute path
   * @param {string} inputPath - The path to normalize
   * @returns {string} - Absolute path
   */
  #toAbsolutePath(inputPath) {
    return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
  }

  #registerOutputPath(sourcePath, relativePath) {
    const outputPath = path.join(this.#config.outputDir, relativePath);
    if (!this.#pathMap.has(sourcePath)) {
      this.#pathMap.set(sourcePath, new Set());
    }
    this.#pathMap.get(sourcePath).add(outputPath);
  }

  #write(filePath, content) {
    const [file, cache, log, liveReload] = this.useContext('file', 'cache', 'log', 'liveReload');
    const outputPath = path.join(this.#config.outputDir, filePath);
        
    // Cache based on OUTPUT content (handles both template and data changes)
    if (cache.hasChanged(outputPath, content)) {
      file.write(outputPath, content);
      cache.set(outputPath, content);
      log.debug(`Written: ${filePath}`);
      
      if (liveReload) {
        liveReload.notifyReload();
      }
    } else {
      log.debug(`Skipped (no changes): ${filePath}`);
    }
  }
}
