import { ServiceProvider } from '@brickworks/engine';
import { createReactor } from '@brickworks/engine/state';
import { progressSink, metricsSink, prettySink } from '@brickworks/engine/logger';
import path from 'path';
import { Cache } from './Cache.js';
import { File } from './File.js';
import { createProgressTracker } from './utils/progress.js';

import { replaceRouteParams } from './Server/utils/routeMatch.js';
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

  #progressTracker = null;
  #pathMap = new Map();

  actions(useContext) {
    const [file, log] = useContext('file', 'log');
    
    // Initialize progress tracker if not already done
    if (!this.#progressTracker) {
      this.#progressTracker = createProgressTracker(log);
    }
    
    return {
      assets: async (opts) => {
        if (!opts.assets) {
          log.debug('No assets directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(opts.assets);
        
        if (filePaths.length === 0) {
          log.debug('No assets to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Assets', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            this.#asset(filePath, opts).then(() => {
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
      scripts: async (opts) => {
        if (!opts.scripts) {
          log.debug('No scripts directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(opts.scripts);
        
        if (filePaths.length === 0) {
          log.debug('No scripts to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Scripts', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            this.#script(filePath, opts).then(() => {
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
      styles: async (opts) => {
        if (!opts.styles) {
          log.debug('No styles directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(opts.styles);
        
        if (filePaths.length === 0) {
          log.debug('No styles to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Styles', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            this.#style(filePath, opts).then(() => {
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
      partials: async (opts) => {
        if (!opts.partials) {
          log.debug('No partials directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(opts.partials);
        
        if (filePaths.length === 0) {
          log.debug('No partials to load');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Loading Partials', filePaths.length, 'files');
        const promises = [];

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          promises.push(
            Promise.resolve(this.#loadPartial(filePath, opts)).then(() => {
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
      views: async (opts) => {
        if (!opts.views) {
          log.debug('No views directory to compile');
          return [];
        }
        const filePaths = file.getFilePaths(opts.views);
        
        if (filePaths.length === 0) {
          log.debug('No views to compile');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Compiling Views', filePaths.length, 'files');
        const promises = [];
        
        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i];
          console.log('filePath', filePath);
          promises.push(
            this.#view(filePath, opts).then(() => {
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

      routes: async (opts) => {
        if (!opts.routes || opts.routes.length === 0) {
          log.debug('No routes to compile');
          return [];
        }
        
        const progressId = this.#progressTracker.createProgressBar('Compiling Routes', opts.routes.length, 'routes');
        const promises = [];
        const routesLength = opts.routes.length;

        for (let i = 0; i < routesLength; i++) {
          const route = opts.routes[i];
          if (route.repeat) {
            const data = route.repeat(opts.data);
            const entries = Array.isArray(data) ? data.entries() : Object.entries(data);
            for (const [key, value] of entries) {
              promises.push(
                this.#route(route, opts, value, key).then(() => {
                  this.#progressTracker.updateProgress(progressId, i + 1, { 
                    current: route.path || 'route' 
                  });
                })
              );
            }
            continue;
          }
          promises.push(
            this.#route(route, opts, null, null).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: route.path || 'route' 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Compiled ${opts.routes.length} routes`);
        
        return promises;
      },
      
      asset:    (path, opts) => this.#asset(path, opts),
      script:   (path, opts) => this.#script(path, opts), 
      style:    (path, opts) => this.#style(path, opts),
      partial:  (path, opts) => this.#loadPartial(path, opts),
      view: (path, opts) => this.#view(path, opts),
      remove:   (path, opts) => this.#remove(path, opts),
      route:    (route, opts, item, key) => this.#route(route, opts, item, key),
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

  async #asset(filePath, opts) {
    const [file, log] = this.useContext('file', 'log');
    const content = file.read(filePath);

    if (content) {
      const assetsDir = opts.assets;
      const absoluteAssetsDir = this.#toAbsolutePath(assetsDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteAssetsDir, absoluteFilePath);
      
      log.debug(`Processing asset: ${filePath}`);
      log.debug(`Asset processed: ${relativePath}`);
      this.#registerOutputPath(filePath, relativePath, opts.outputDir);
      return this.#write(relativePath, content, opts.outputDir);
    }
  }

  async #script(filePath, opts) {
    const [file, log] = this.useContext('file', 'log');
    const content = file.read(filePath);

    if (content && opts.scriptCompiler && typeof opts.scriptCompiler === 'function') {
      const scriptsDir = opts.scripts;
      const fileName = path.basename(filePath);
      
      // Ensure both paths are absolute for proper relative calculation
      const absoluteScriptsDir = this.#toAbsolutePath(scriptsDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteScriptsDir, absoluteFilePath);

      try {
        log.debug(`Using configured script compiler for: ${filePath}`);
        const compiled = await opts.scriptCompiler(content, filePath);
        log.debug(`Script compiled successfully: ${fileName}`);
        this.#registerOutputPath(filePath, relativePath, opts.outputDir);
        return this.#write(relativePath, compiled, opts.outputDir);
      } catch (err) {
        log.warn(`Script compilation failed for ${filePath}: ${err.message}`);  
      }
    }
  }

  async #style(filePath, opts) {
    const [file, log] = this.useContext('file', 'log');
    const content = file.read(filePath);

    if (content && opts.styleCompiler && typeof opts.styleCompiler === 'function') {
      const stylesDir = opts.styles;
      
      // Ensure both paths are absolute for proper relative calculation
      const absoluteStylesDir = this.#toAbsolutePath(stylesDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteStylesDir, absoluteFilePath).replace(/\.(scss|sass|less|styl)$/, '.css');
      const fileName = path.basename(relativePath);

      try {
        log.debug(`Using configured style compiler for: ${filePath}`);
        const compiled = await opts.styleCompiler(content, filePath);
        log.debug(`Style compiled successfully: ${fileName}`);
        this.#registerOutputPath(filePath, relativePath, opts.outputDir);
        return this.#write(relativePath, compiled, opts.outputDir);
      } catch (err) {
        log.warn(`Style compilation failed for ${filePath}: ${err.message}`);
      }
    }
  }

  #loadPartial(filePath, opts) {
    const [file, log] = this.useContext('file', 'log');

    if (file.exists(filePath) && opts.renderEngine) {
      try {
        const partialsDir = opts.partials;
        const relativePath = path.relative(partialsDir, filePath);
        
        // Get the partial name without extension (e.g., 'header.html' -> 'header')
        const partialName = path.parse(relativePath).name;
        
        // Read the partial content
        const content = file.read(filePath);
        
        log.debug(`Registering partial: ${partialName}`);
        opts.renderEngine.register(partialName, content);
        log.debug(`Registered partial: ${partialName}`);
      } catch (err) {
        log.warn('Could not register partials:', err.message);
      }
    }
  }

  async #view(filePath, opts) {
    const [file, liveReload, log] = this.useContext('file', 'liveReload', 'log');

    if (file.exists(filePath) && opts.renderEngine) {
      const fileName = path.basename(filePath);
      const viewsDir = opts.views;
      
      // Ensure both paths are absolute for proper relative calculation
      const absoluteViewsDir = this.#toAbsolutePath(viewsDir);
      const absoluteFilePath = this.#toAbsolutePath(filePath);
      const relativePath = path.relative(absoluteViewsDir, absoluteFilePath);
      const renderedContent = await this.#template(filePath, opts.data, opts);
      this.#registerOutputPath(relativePath, relativePath, opts.outputDir);
      return this.#write(relativePath, renderedContent, opts.outputDir);
    }
  }

  async #route(route, opts, value, key) {
    const [file, log] = this.useContext('file', 'log');
    const data =  route.data(opts.data, value, key);
    const relativePath = replaceRouteParams(route.path, data);
    const outputPath = formatOutputPath(relativePath);
            
    if (file.exists(route.template) && opts.renderEngine) {
      const renderedContent = await this.#template(route.template, data, opts);
      this.#registerOutputPath(relativePath, outputPath, opts.outputDir);
      return this.#write(outputPath, renderedContent, opts.outputDir);      
    } else {
      log.warn(`No template compiler configured for route: ${route.path}`);
    }
  }

  async #template(templatePath, data, opts) {
    const [file, log] = this.useContext('file', 'log');
    try {
      const template = file.read(templatePath);
      let renderedContent = await opts.renderEngine.render(template, data);
      renderedContent = await this.#injectLiveReloadScript(renderedContent, opts);
      return renderedContent;
    } catch (err) {
      log.debug('Error compiling', err)
    }
  }

  async #injectLiveReloadScript(renderedContent, opts) {
    const [liveReload, log] = this.useContext('liveReload', 'log');
    try {
      if (liveReload && renderedContent.includes('</body>')) {
          log.debug('Injecting live reload script');
          renderedContent = await liveReload.injectLiveReloadScript(renderedContent, opts);
      }
      return renderedContent;
    } catch (err) {
      log.debug('Error injecting live reload script', err);
      return renderedContent;
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

  #registerOutputPath(sourcePath, relativePath, outputDir) {
    const outputPath = path.join(outputDir, relativePath);
    if (!this.#pathMap.has(sourcePath)) {
      this.#pathMap.set(sourcePath, new Set());
    }
    this.#pathMap.get(sourcePath).add(outputPath);
  }

  #write(filePath, content, outputDir) {
    const [file, cache, log, liveReload] = this.useContext('file', 'cache', 'log', 'liveReload');
    const outputPath = path.join(outputDir, filePath);
        
    // Cache based on OUTPUT content (handles both template and data changes)
    if (cache.hasChanged(outputPath, content)) {
      file.write(outputPath, content);
      cache.set(outputPath, content);
      log.debug(`Written: ${filePath}`);
      
      if (liveReload) {
        liveReload.notifyReload();
      }
      return outputPath;
    } else {
      log.debug(`Skipped (no changes): ${filePath}`);
    }
  }
}
