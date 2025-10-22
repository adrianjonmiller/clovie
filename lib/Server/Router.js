import { ServiceProvider } from '@brickworks/engine';
import { createReactor, isDirtyReactor } from '@brickworks/engine/state';
import path from 'path';

export class Route extends ServiceProvider {
  static manifest = {
    name: 'Clovie Route',
    namespace: 'router',
    version: '1.0.0',
  }
  #staticCache = new Set();
  #cache = new Map();
  #cacheSize = 100;

  initialize(useContext, config) {
    this.#cacheSize = config.cacheSize || 100;
  }

  actions(useContext) {
    return {
      setHooks: (opts) => {
        const server = this.useContext('server');
        if (!opts) {
          return;
        }
        if (opts.hooks) {
          server.hooks(opts.hooks);
        }
        return this;
      },
      clearStaticCache: () => {
        this.#staticCache.forEach(outputPath => {
          file.delete(outputPath);
        });
        this.#staticCache.clear();
      },
      serveRoutes: async (opts) => {
        const server = this.useContext('server');
        if (!opts.routes) {
          return;
        }
        for (const route of opts.routes) {
          server.add('GET', route.path, async (context) => {
            try {
              const content = await this.#routeHandler(route, context, opts);
              return context.respond.html(content);
            } catch (error) {
              console.error('Error rendering route', error);
              return context.respond.text('Internal Server Error', 500);
            } 
          },
          route.meta
          );
        }
      },
      serveApi: (opts) => {
        const server = this.useContext('server');
        if (!opts.api) {
          return;
        }
        for (const api of opts.api) {
          server.add(api.method, api.path, (context) => {
            try {
              return this.#apiHandler(api, context, opts);
            } catch (error) {
              console.error('Error rendering route', error);
              return context.respond.text('Internal Server Error', 500);
            }
          },
          api.meta
        );
        }
        return;
      }
    }
  }

  #apiHandler(api, context) {
    const database = this.useContext('database');
    return api.handler(context, database);
  }

  async #routeHandler(route, context, opts) {
    const [file, database, liveReload, log] = this.useContext('file', 'database', 'liveReload', 'log');
    
    // Create unique cache key from request
    const cacheKey = this.#instancePath(context.req);

    if (this.#cache.has(cacheKey)) {
      return await this.#cache.get(cacheKey).compile();
    }

    try {
      const instance = {
        watcherCleanup: liveReload && opts.mode === 'development' ? file.watch(route.template, async () => {
          instance.dirty = true;
          if (liveReload) {
            liveReload.notifyReload();
          }
        }) : null,
        route,
        outputPath: this.#formatOutputPath(opts.outputDir, context.req.path),
        dirty: true,
        dataReactor: createReactor(async () => {
          instance.dirty = true;
          if (liveReload) {
            liveReload.notifyReload();
          }
          return (await route.data(context, database));
        }),
        compile: async () => {
          try {
            if (isDirtyReactor(instance.dataReactor) || instance.dirty) {
              if (!file.exists(instance.route.template)) {
                throw new Error(`Template not found: ${instance.route.template}`);
              }
              instance.lastAccess = Date.now();
              instance.expires = Date.now() + 1000 * 60 * 60 * 24 * 30;
              const template = file.read(instance.route.template);
              let renderedContent = await opts.renderEngine.render(template, {...(opts.data || {}), ...(await instance.dataReactor() || {})})
              if (liveReload && opts.mode === 'development') {
                renderedContent = await liveReload.injectLiveReloadScript(renderedContent, opts);
              }
              file.write(instance.outputPath, renderedContent);
              instance.dirty = false;
              return renderedContent;
            }
            return file.read(instance.outputPath);
          } catch (error) {
            console.error('Error compiling route', error);
          } finally {
            instance.dirty = false;
          }
        }
      }
      this.#addInstanceCache(cacheKey, instance);
      return instance.compile();
    } catch (error) {
      console.error('Error rendering route', error);
    }
  }

  #addInstanceCache(path, instance) {
    this.#cache.set(path, instance);
    if (this.#cache.size > this.#cacheSize) {
      this.#cache.delete(this.#cache.keys().next().value);
    }
    return instance;
  }

  /**
   * Format output path to ensure proper .html extensions
   * @private
   */
  #formatOutputPath(outputDir, reqPath) {
    // Handle root path
    if (reqPath === '/' || reqPath === '') {
      return path.join(outputDir, 'index.html');
    }

    // If already has .html extension, use as-is
    if (reqPath.endsWith('.html')) {
      return path.join(outputDir, reqPath);
    }

    // Add .html extension
    // For paths like /posts or /posts/my-slug, both become .html files
    return path.join(outputDir, `${reqPath}.html`);
  }

  /**
   * Create unique instance cache key from request
   * Combines path, params, and query for unique identification
   * @private
   */
  #instancePath(req) {
    let key = req.path;
    
    // Add route params if present (e.g., /posts/:slug)
    if (req.params && Object.keys(req.params).length > 0) {
      const paramsStr = Object.entries(req.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      key += `?params:${paramsStr}`;
    }
    
    // Add query params if present (e.g., ?page=1&sort=desc)
    if (req.query && Object.keys(req.query).length > 0) {
      const queryStr = Object.entries(req.query)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      key += `${req.params ? '&' : '?'}query:${queryStr}`;
    }
    
    return key;
  }
}