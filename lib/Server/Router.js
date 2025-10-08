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
      serveRoutes: (opts) => {
        const server = this.useContext('server');
        if (!opts.routes) {
          return;
        }
        for (const route of opts.routes) {
          server.add('GET', route.path, (context) => {
            try {
              const content = this.#routeHandler(route, context, opts);
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

  #routeHandler(route, context, opts) {
    const [file, database] = this.useContext('file', 'database');

    if (this.#cache.has(context.req.path)) {
      return this.#cache.get(context.req.path).compile();
    }

    try {
      const instance = {
        route,
        outputPath: this.#formatOutputPath(opts.outputDir, context.req.path),
        dirty: true,
        dataReactor: createReactor(() => {
          instance.dirty = true;
          return route.data(context, database)
        }),
        compile: () => {
          try {
            if (isDirtyReactor(instance.dataReactor) || instance.dirty) {
              const template = file.read(instance.route.template);
              if (!template) {
                throw new Error(`Template not found: ${instance.route.template}`);
              }
              instance.lastAccess = Date.now();
              instance.expires = Date.now() + 1000 * 60 * 60 * 24 * 30;    
              const renderedContent = opts.templateCompiler(template, instance.dataReactor())
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
      this.#addInstanceCache(context.req.path, instance);
      return instance.compile();
    } catch (error) {
      console.error('Error rendering route', error);
    }
  }

  #addInstanceCache(path, instance) {
    this.#cache.set(path, instance);
    if (this.#cache.size > 100) {
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
}