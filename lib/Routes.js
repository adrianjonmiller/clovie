import { ServiceProvider } from '@brickworks/engine';
import path from 'path';
import fs from 'fs';

export class Routes extends ServiceProvider {
  static manifest = {
    name: 'Clovie Routes',
    namespace: 'routes',
    version: '1.0.0'
  };

  initialize(useContext, config) {
    this.#config = config;
  }

  #config;

  actions(useContext) {
    const { file, state } = useContext();
    
    return {
      /**
       * Convert everything to routes - both traditional views and configured routes
       */
      generateRoutes: async () => {
        const routes = [];
        
        // 1. Convert traditional views to routes
        if (this.#config.views && file.exists(this.#config.views)) {
          console.log('🛣️  Converting views to routes...');
          const viewRoutes = await this.#convertViewsToRoutes(file, this.#config.views);
          routes.push(...viewRoutes);
          console.log(`   Converted ${viewRoutes.length} views to routes`);
        }
        
        // 2. Add configured routes
        if (this.#config.routes && Array.isArray(this.#config.routes)) {
          console.log('🛣️  Processing configured routes...');
          const configuredRoutes = await this.#processConfiguredRoutes(state);
          routes.push(...configuredRoutes);
          console.log(`   Processed ${configuredRoutes.length} configured routes`);
        }
        
        // 3. Add API routes
        if (this.#config.api && Array.isArray(this.#config.api)) {
          console.log('🔌 Processing API routes...');
          const apiRoutes = await this.#processApiRoutes(state);
          routes.push(...apiRoutes);
          console.log(`   Processed ${apiRoutes.length} API routes`);
        }
        
        console.log(`🛣️  Total routes generated: ${routes.length}`);
        return routes;
      },

      /**
       * Process all routes and generate pages
       */
      processRoutes: async (routes) => {
        const pages = {};
        const partials = {};
        
        // First, collect partials from views directory
        if (this.#config.partials && file.exists(this.#config.partials)) {
          const partialFiles = file.readNames(this.#config.partials);
          for (const filePath of partialFiles) {
            const content = file.readFile(filePath);
            if (content) {
              const fileName = path.parse(filePath).name;
              partials[fileName] = content;
            }
          }
        }
        
        // Process each route
        for (const route of routes) {
          try {
            if (route.repeat && typeof route.repeat === 'function') {
              // Route with repeat function - generate multiple pages
              const items = await route.repeat(state);
              
              if (!Array.isArray(items)) {
                console.warn(`⚠️  Repeat function for route ${route.name} must return an array`);
                continue;
              }
              
              for (const item of items) {
                const routePages = await this.#processRouteWithItem(route, item, state);
                Object.assign(pages, routePages);
              }
            } else {
              // Single route
              const routePages = await this.#processRouteWithItem(route, {}, state);
              Object.assign(pages, routePages);
            }
          } catch (err) {
            console.error(`❌ Error processing route ${route.name}:`, err);
          }
        }
        
        return { pages, partials };
      },

      /**
       * Setup dynamic routes for Express server mode
       */
      setupServerRoutes: async (app) => {
        const { routes } = useContext();
        console.log('🛣️  Setting up server routes...');
        
        // Setup global middleware from config
        if (this.#config.middleware && Array.isArray(this.#config.middleware)) {
          console.log(`   Adding ${this.#config.middleware.length} global middleware`);
          this.#config.middleware.forEach(middleware => {
            app.use(middleware);
          });
        }
        
        // Get all routes (views + configured routes)
        const allRoutes = await routes.generateRoutes();
        
        // Setup each route as Express endpoint
        for (const route of allRoutes) {
          try {
            await this.#setupSingleServerRoute(app, route, state);
          } catch (err) {
            console.error(`❌ Error setting up server route ${route.path}:`, err);
          }
        }
        
        console.log(`✅ Set up ${allRoutes.length} server routes`);
      }
    };
  }

  /**
   * Convert traditional views directory structure to routes
   */
  async #convertViewsToRoutes(file, viewsDir) {
    const routes = [];
    const viewFiles = file.readNames(viewsDir);
    
    for (const filePath of viewFiles) {
      // Skip partials (files starting with _)
      if (path.parse(filePath).name.startsWith('_')) {
        continue;
      }
      
      const content = file.readFile(filePath);
      if (!content) continue;
      
      // Create relative path from views directory
      const relativePath = path.relative(viewsDir, filePath);
      
      // Convert file path to URL path
      let urlPath = '/' + relativePath.replace(/\.[^/.]+$/, '');
      
      // Handle index files
      if (urlPath.endsWith('/index')) {
        urlPath = urlPath.replace('/index', '') || '/';
      }
      
      // Ensure leading slash
      if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
      }
      
      // Create route object
      const route = {
        name: `View: ${relativePath}`,
        path: urlPath,
        template: content, // Store template content directly
        isViewRoute: true, // Mark as converted from view
        originalPath: filePath,
        data: (state, item) => {
          // For view routes, merge item with global data
          const globalData = state.get ? state.get([]) || {} : {};
          return {
            ...globalData,
            ...item
          };
        }
      };
      
      routes.push(route);
    }
    
    return routes;
  }

  /**
   * Process configured routes from config
   */
  async #processConfiguredRoutes(state) {
    const routes = [];
    
    for (const configRoute of this.#config.routes) {
      // Validate required properties
      if (!configRoute.name || !configRoute.path || !configRoute.template) {
        console.warn(`⚠️  Skipping invalid route: missing name, path, or template`);
        continue;
      }
      
      // Load template content (relative to config file)
      let templateContent;
      try {
        const configDir = process.cwd(); // Config file directory
        const templatePath = path.resolve(configDir, configRoute.template);
        
        if (!fs.existsSync(templatePath)) {
          console.warn(`⚠️  Template not found: ${templatePath} for route ${configRoute.name}`);
          continue;
        }
        
        templateContent = fs.readFileSync(templatePath, 'utf8');
      } catch (err) {
        console.error(`❌ Error loading template for route ${configRoute.name}:`, err);
        continue;
      }
      
      // Create route object
      const route = {
        ...configRoute,
        template: templateContent, // Store template content
        isConfigRoute: true // Mark as configured route
      };
      
      routes.push(route);
    }
    
    return routes;
  }

  /**
   * Process API routes from config
   */
  async #processApiRoutes(state) {
    const routes = [];
    
    for (const apiRoute of this.#config.api) {
      // Validate required properties
      if (!apiRoute.name || !apiRoute.path || !apiRoute.action) {
        console.warn(`⚠️  Skipping invalid API route: missing name, path, or action`);
        continue;
      }
      
      // Create API route object
      const route = {
        ...apiRoute,
        isApiRoute: true, // Mark as API route
        method: apiRoute.method || 'GET' // Default to GET
      };
      
      routes.push(route);
    }
    
    return routes;
  }

  /**
   * Process a single route with an item
   */
  async #processRouteWithItem(route, item, state) {
    const pages = {};
    
    // Execute data function
    let routeData = {};
    if (typeof route.data === 'function') {
      try {
        // New signature: data(state, item)
        routeData = await route.data(state, item);
      } catch (err) {
        console.error(`Error executing data function for route ${route.name}:`, err);
        routeData = item;
      }
    } else if (route.data && typeof route.data === 'object') {
      routeData = { ...route.data, ...item };
    } else {
      routeData = item;
    }
    
    // Generate output path
    let outputPath = route.path;
    
    // Replace parameters in path with values from data
    const paramRegex = /:([^\/]+)/g;
    let match;
    while ((match = paramRegex.exec(route.path)) !== null) {
      const paramName = match[1];
      const value = routeData[paramName] || item[paramName] || '';
      outputPath = outputPath.replace(`:${paramName}`, value);
    }
    
    // Convert to file path
    if (outputPath === '/') {
      outputPath = 'index.html';
    } else {
      // Remove leading slash and add .html if needed
      outputPath = outputPath.startsWith('/') ? outputPath.slice(1) : outputPath;
      if (!outputPath.endsWith('.html')) {
        outputPath = outputPath.endsWith('/') 
          ? `${outputPath}index.html` 
          : `${outputPath}.html`;
      }
    }
    
    // Create page object
    pages[outputPath] = {
      template: route.template,
      data: routeData
    };
    
    return pages;
  }

  /**
   * Setup a single route as Express endpoint
   */
  async #setupSingleServerRoute(app, route, state) {
    // Skip routes with repeat function in server mode (they're for static generation)
    if (route.repeat && typeof route.repeat === 'function') {
      console.log(`⚠️  Skipping route with repeat function in server mode: ${route.path}`);
      return;
    }

    // Handle API routes differently
    if (route.isApiRoute) {
      return this.#setupApiRoute(app, route, state);
    }

    // Create route handler for regular routes
    const handler = async (req, res, next) => {
      try {
        // Extract parameters from URL
        const params = req.params || {};
        
        // Execute data function with state and params
        let routeData = {};
        if (typeof route.data === 'function') {
          try {
            routeData = await route.data(state, params);
          } catch (err) {
            console.error(`Error executing data function for route ${route.name}:`, err);
            return res.status(500).send('Internal Server Error');
          }
        } else if (route.data && typeof route.data === 'object') {
          routeData = { ...route.data, ...params };
        } else {
          routeData = params;
        }

        // Compile template with data
        let content = route.template;
        if (this.#config.templateCompiler || this.#config.compiler) {
          const compiler = this.#config.templateCompiler || this.#config.compiler;
          try {
            content = compiler(route.template, routeData);
          } catch (err) {
            console.error(`Template compilation error for route ${route.name}:`, err);
            return res.status(500).send('Template Error');
          }
        }

        res.send(content);
      } catch (err) {
        console.error(`Error handling route ${route.path}:`, err);
        res.status(500).send('Internal Server Error');
      }
    };

    // Setup route-specific middleware (beforeEnter)
    const middlewares = [];
    if (route.beforeEnter && typeof route.beforeEnter === 'function') {
      middlewares.push(route.beforeEnter);
    }

    // Register route with Express
    app.get(route.path, ...middlewares, handler);
    console.log(`✅ Registered server route: ${route.path}`);
  }

  /**
   * Setup a single API route as Express endpoint
   */
  async #setupApiRoute(app, route, state) {
    // Create API handler
    const handler = async (req, res, next) => {
      try {
        // Extract parameters from URL
        const params = req.params || {};
        
        // Create event object (similar to serverless functions)
        const event = {
          params,
          query: req.query,
          body: req.body,
          headers: req.headers,
          method: req.method,
          path: req.path,
          url: req.url
        };

        // Execute action function with state and event
        let result;
        if (typeof route.action === 'function') {
          try {
            result = await route.action(state, event);
          } catch (err) {
            console.error(`Error executing action for API route ${route.name}:`, err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
        } else {
          return res.status(500).json({ error: 'No action function defined' });
        }

        // Handle different response types
        if (result === null || result === undefined) {
          res.status(204).send(); // No content
        } else if (typeof result === 'object') {
          res.json(result);
        } else {
          res.send(String(result));
        }
      } catch (err) {
        console.error(`Error handling API route ${route.path}:`, err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    };

    // Setup route-specific middleware (before)
    const middlewares = [];
    if (route.before && typeof route.before === 'function') {
      middlewares.push(route.before);
    }

    // Register API route with Express using the specified method
    const method = (route.method || 'GET').toLowerCase();
    if (app[method]) {
      app[method](route.path, ...middlewares, handler);
      console.log(`✅ Registered API route: ${method.toUpperCase()} ${route.path}`);
    } else {
      console.error(`❌ Unsupported HTTP method: ${method}`);
    }
  }
}
