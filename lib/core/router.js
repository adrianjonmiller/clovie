import path from 'path';
import fs from 'fs';

/**
 * Router class that handles both static and dynamic routing for Clovie
 * Supports parameterized routes, middleware, and before/after hooks
 */
export class ClovieRouter {
  constructor(config, clovieInstance) {
    this.config = config;
    this.clovie = clovieInstance;
    this.routes = config.routes || [];
    this.apiRoutes = config.api || [];
    this.mode = config.mode || 'static'; // 'static' or 'live'
  }

  /**
   * Parse route path and extract parameter names
   * Example: '/blog/:slug' -> { pattern: /^\/blog\/([^\/]+)$/, params: ['slug'] }
   */
  parseRoutePath(routePath) {
    const paramNames = [];
    const pattern = routePath.replace(/:([^\/]+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    
    return {
      pattern: new RegExp(`^${pattern}$`),
      params: paramNames,
      originalPath: routePath
    };
  }

  /**
   * Extract parameters from a URL path using a route pattern
   */
  extractParams(url, routePattern) {
    const match = url.match(routePattern.pattern);
    if (!match) return null;

    const params = {};
    routePattern.params.forEach((paramName, index) => {
      params[paramName] = match[index + 1];
    });

    return params;
  }

  /**
   * Get the template for a route (relative to config file)
   */
  async getRouteTemplate(route) {
    if (!route.template) {
      throw new Error(`Route ${route.name} missing template property`);
    }

    // Build full path relative to config file directory
    // We need to get the config file path from the clovie instance
    const configDir = process.cwd(); // Default to current working directory
    const templatePath = path.resolve(configDir, route.template);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath} for route ${route.name}`);
    }

    return fs.readFileSync(templatePath, 'utf8');
  }

  /**
   * Merge global data with route-specific data
   */
  mergeData(globalData, localData) {
    return {
      ...globalData,
      ...localData
    };
  }

  /**
   * Execute route data function with new signature (item, globalData)
   */
  async executeRouteData(route, item = {}, req = null) {
    let localData = {};

    if (typeof route.data === 'function') {
      try {
        // New signature: data(item, globalData)
        const globalData = this.clovie?.data || this.config.data || {};
        localData = await route.data(item, globalData);
      } catch (err) {
        console.error(`Error executing data function for route ${route.name}:`, err);
        localData = {};
      }
    } else if (route.data && typeof route.data === 'object') {
      localData = route.data;
    }

    // Merge with global data from config
    const globalData = this.clovie?.data || this.config.data || {};
    return this.mergeData(globalData, localData);
  }

  /**
   * Execute before hook for a route
   */
  async executeBefore(route, req, res) {
    // Global before hook
    if (this.config.before && typeof this.config.before === 'function') {
      const globalResult = await this.config.before(req, res);
      if (globalResult === false) return false;
    }

    // Route-specific before hook
    if (route.before && typeof route.before === 'function') {
      const routeResult = await route.before(req, res);
      if (routeResult === false) return false;
    }

    return true;
  }

  /**
   * Execute after hook for a route
   */
  async executeAfter(route, req, res) {
    // Route-specific after hook
    if (route.after && typeof route.after === 'function') {
      await route.after(req, res);
    }

    // Global after hook
    if (this.config.after && typeof this.config.after === 'function') {
      await this.config.after(req, res);
    }
  }

  /**
   * Generate static files for all routes
   */
  async generateStaticRoutes() {
    const generatedFiles = {};

    for (const route of this.routes) {
      try {
        const routePattern = this.parseRoutePath(route.path);
        
        // Check if route has a repeat function
        if (route.repeat && typeof route.repeat === 'function') {
          // Get items from repeat function
          const globalData = this.clovie?.data || this.config.data || {};
          let items;
          
          try {
            items = await route.repeat(globalData);
          } catch (err) {
            console.error(`Error executing repeat function for route ${route.name}:`, err);
            continue;
          }

          if (!Array.isArray(items)) {
            console.warn(`⚠️  Repeat function for route ${route.name} must return an array`);
            continue;
          }

          // Generate a page for each item
          const template = await this.getRouteTemplate(route);
          
          for (const item of items) {
            // Execute data function with item
            const data = await this.executeRouteData(route, item);
            
            // Generate output path by replacing parameters
            let outputPath = route.path;
            
            // Replace parameters like :slug with values from item or data
            for (const param of routePattern.params) {
              const value = data[param] || item[param] || '';
              outputPath = outputPath.replace(`:${param}`, value);
            }

            // Ensure proper file extension
            if (outputPath === '/') {
              outputPath = '/index.html';
            } else if (!outputPath.endsWith('.html')) {
              outputPath = outputPath.endsWith('/') 
                ? `${outputPath}index.html` 
                : `${outputPath}.html`;
            }

            // Remove leading slash for file system
            const fileName = outputPath.startsWith('/') ? outputPath.slice(1) : outputPath;

            // Compile template
            if (this.config.compiler) {
              const compiled = this.config.compiler(template, data);
              generatedFiles[fileName] = compiled;
            } else {
              generatedFiles[fileName] = template;
            }

            console.log(`✅ Generated static route: ${route.path} -> ${fileName} (${JSON.stringify(item)})`);
          }

        } else {
          // Handle routes without repeat function
          if (routePattern.params.length > 0) {
            console.warn(`⚠️  Skipping parameterized route ${route.path} without repeat function`);
            continue;
          }

          // Get template and data
          const template = await this.getRouteTemplate(route);
          const data = await this.executeRouteData(route, {});

          // Generate output path
          let outputPath = route.path;
          if (outputPath === '/') {
            outputPath = '/index.html';
          } else if (!outputPath.endsWith('.html')) {
            outputPath = outputPath.endsWith('/') 
              ? `${outputPath}index.html` 
              : `${outputPath}.html`;
          }

          // Remove leading slash for file system
          const fileName = outputPath.startsWith('/') ? outputPath.slice(1) : outputPath;

          // Compile template
          if (this.config.compiler) {
            const compiled = this.config.compiler(template, data);
            generatedFiles[fileName] = compiled;
          } else {
            generatedFiles[fileName] = template;
          }

          console.log(`✅ Generated static route: ${route.path} -> ${fileName}`);
        }

      } catch (err) {
        console.error(`❌ Error generating static route ${route.path}:`, err);
      }
    }

    return generatedFiles;
  }

  /**
   * Setup dynamic routes for Express server
   */
  setupDynamicRoutes(app) {
    // Setup global middleware
    if (this.config.middleware && Array.isArray(this.config.middleware)) {
      this.config.middleware.forEach(middleware => {
        app.use(middleware);
      });
    }

    // Setup regular routes
    for (const route of this.routes) {
      try {
        const routePattern = this.parseRoutePath(route.path);

        // Setup route-specific middleware
        const middlewares = [];
        if (route.middleware && Array.isArray(route.middleware)) {
          middlewares.push(...route.middleware);
        }

        // Main route handler
        const handler = async (req, res, next) => {
          try {
            // Extract parameters
            const params = this.extractParams(req.path, routePattern) || {};
            req.params = { ...req.params, ...params };

            // Execute before hooks
            const beforeResult = await this.executeBefore(route, req, res);
            if (beforeResult === false) {
              return; // Before hook handled the response
            }

            // Get template and data
            const template = await this.getRouteTemplate(route);
            // For dynamic routes, we pass params as the item (for backward compatibility)
            const data = await this.executeRouteData(route, params, req);

            // Compile and send response
            let content = template;
            if (this.config.compiler) {
              content = this.config.compiler(template, data);
            }

            res.send(content);

            // Execute after hooks
            await this.executeAfter(route, req, res);

          } catch (err) {
            console.error(`Error handling route ${route.path}:`, err);
            res.status(500).send('Internal Server Error');
          }
        };

        // Register route with Express
        app.get(route.path, ...middlewares, handler);
        console.log(`✅ Registered dynamic route: ${route.path}`);

      } catch (err) {
        console.error(`❌ Error setting up dynamic route ${route.path}:`, err);
      }
    }

    // Setup API routes
    for (const apiRoute of this.apiRoutes) {
      try {
        const method = (apiRoute.method || 'GET').toLowerCase();
        
        // Setup route-specific middleware
        const middlewares = [];
        if (apiRoute.middleware && Array.isArray(apiRoute.middleware)) {
          middlewares.push(...apiRoute.middleware);
        }

        // API route handler
        const handler = async (req, res, next) => {
          try {
            const result = await apiRoute.handler(req, res);
            
            // If handler didn't send response, send the result as JSON
            if (result && !res.headersSent) {
              res.json(result);
            }
          } catch (err) {
            console.error(`Error handling API route ${apiRoute.path}:`, err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Internal Server Error' });
            }
          }
        };

        // Register API route
        if (app[method]) {
          app[method](apiRoute.path, ...middlewares, handler);
          console.log(`✅ Registered API route: ${method.toUpperCase()} ${apiRoute.path}`);
        } else {
          console.error(`❌ Unsupported HTTP method: ${method}`);
        }

      } catch (err) {
        console.error(`❌ Error setting up API route ${apiRoute.path}:`, err);
      }
    }
  }

  /**
   * Find route by path for static generation
   */
  findRoute(path) {
    for (const route of this.routes) {
      const routePattern = this.parseRoutePath(route.path);
      if (this.extractParams(path, routePattern)) {
        return route;
      }
    }
    return null;
  }
}

export default ClovieRouter;