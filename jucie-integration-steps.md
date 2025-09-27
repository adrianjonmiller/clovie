# 🔗 jucie-engine Integration Guide

## 🎯 Strategy: Bundle + Service Architecture

Transform Clovie into a service-based architecture using your private jucie-engine framework.

## 📦 Step 1: Create jucie-engine Bundle

**In your jucie-engine project:**

```bash
# Install build tools
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-terser

# Create rollup.config.js
cat > rollup.config.js << 'EOF'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from '@rollup/plugin-terser';

export default {
  input: 'src/index.js', // Your main jucie-engine entry
  output: [
    {
      file: '../clovie/lib/vendor/jucie-engine.js',
      format: 'es',
      exports: 'named'
    },
    {
      file: '../clovie/lib/vendor/jucie-engine.min.js', 
      format: 'es',
      exports: 'named',
      plugins: [terser()]
    }
  ],
  plugins: [
    nodeResolve({ 
      preferBuiltins: true,
      exportConditions: ['node']
    })
  ],
  external: [] // Bundle everything to avoid exposing private deps
};
EOF

# Build the bundle
npm run build
```

## 🏗️ Step 2: Service-Based Clovie Architecture

**Create:** `lib/core/engine.js`

```javascript
import { Engine, ServiceProvider } from '../vendor/jucie-engine.js';

/**
 * Clovie Engine - wraps jucie-engine with Clovie-specific functionality
 */
export class ClovieEngine extends Engine {
  constructor(config) {
    super();
    this.config = config;
    this.services = new Map();
  }
  
  async initialize() {
    // Install core Clovie services
    await this.installCoreServices();
    
    // Install user-defined services from config
    if (this.config.services) {
      await this.installUserServices();
    }
    
    console.log(`🚀 Clovie Engine initialized with ${this.services.size} services`);
  }
  
  async installCoreServices() {
    const { ClovieRouterService } = await import('./services/router-service.js');
    const { ClovieTemplateService } = await import('./services/template-service.js');
    const { ClovieAssetService } = await import('./services/asset-service.js');
    
    await this.install(ClovieRouterService, ClovieTemplateService, ClovieAssetService);
  }
}
```

## 🛣️ Step 3: Router as a Service

**Create:** `lib/core/services/router-service.js`

```javascript
import { ServiceProvider } from '../../vendor/jucie-engine.js';
import path from 'path';
import fs from 'fs';

export class ClovieRouterService extends ServiceProvider {
  static manifest = {
    name: 'Clovie Router',
    namespace: 'router',
    version: '1.0.0',
    dependencies: [], // Can depend on template service
    defaults: {
      mode: 'static',
      baseUrl: '/'
    }
  };

  initialize({ engine, state }) {
    state.routes = new Map();
    state.apiRoutes = new Map();
    console.log('🛣️  Router service initialized');
  }

  actions({ engine, state }) {
    return {
      // Register a route
      addRoute: (routeConfig) => {
        const { path, name, view, data, before, after, middleware } = routeConfig;
        
        state.routes.set(name, {
          path, view, data, before, after, middleware,
          pattern: this.parseRoutePath(path)
        });
        
        console.log(`✅ Route registered: ${path} (${name})`);
        return this;
      },

      // Register API route
      addApiRoute: (apiConfig) => {
        const { path, method = 'GET', handler, middleware } = apiConfig;
        const key = `${method.toUpperCase()}:${path}`;
        
        state.apiRoutes.set(key, { path, method, handler, middleware });
        console.log(`✅ API route registered: ${method.toUpperCase()} ${path}`);
        return this;
      },

      // Generate static files
      generateStatic: async () => {
        const pages = {};
        
        for (const [name, route] of state.routes) {
          try {
            // Skip parameterized routes in static mode
            if (route.pattern.params.length > 0) {
              console.warn(`⚠️  Skipping parameterized route ${route.path} in static mode`);
              continue;
            }

            // Get template
            const template = await this.getRouteTemplate(route);
            
            // Execute data function
            const data = await this.executeRouteData(route);
            
            // Use template service to compile
            const content = engine.template 
              ? await engine.template.compile(template, data)
              : template;

            // Determine output path
            const outputPath = this.getOutputPath(route.path);
            pages[outputPath] = content;
            
            console.log(`✅ Generated static route: ${route.path} -> ${outputPath}`);
          } catch (err) {
            console.error(`❌ Error generating route ${route.path}:`, err);
          }
        }
        
        return pages;
      },

      // Setup Express routes (for live mode)
      setupExpress: (app) => {
        // Setup routes
        for (const [name, route] of state.routes) {
          this.setupExpressRoute(app, route);
        }
        
        // Setup API routes
        for (const [key, apiRoute] of state.apiRoutes) {
          this.setupExpressApiRoute(app, apiRoute);
        }
      }
    };
  }

  middleware({ engine, state }) {
    return (action, ctx, next) => {
      // Router-level middleware
      if (action.startsWith('route:')) {
        console.log(`🛣️  Routing action: ${action}`);
      }
      return next();
    };
  }

  // Helper methods
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

  async getRouteTemplate(route) {
    const viewPath = path.join(this.config.views || './views', route.view);
    if (!fs.existsSync(viewPath)) {
      throw new Error(`View not found: ${viewPath}`);
    }
    return fs.readFileSync(viewPath, 'utf8');
  }

  async executeRouteData(route, params = {}, req = null) {
    let localData = {};
    
    if (typeof route.data === 'function') {
      localData = await route.data(params, req);
    } else if (route.data) {
      localData = route.data;
    }
    
    // Merge with global data
    return { ...this.config.data, ...localData };
  }

  getOutputPath(routePath) {
    if (routePath === '/') return 'index.html';
    if (routePath.endsWith('/')) return `${routePath}index.html`;
    return routePath.endsWith('.html') ? routePath.slice(1) : `${routePath}.html`.slice(1);
  }

  setupExpressRoute(app, route) {
    // Implementation for Express route setup
    const middlewares = route.middleware || [];
    
    app.get(route.path, ...middlewares, async (req, res) => {
      try {
        // Extract params
        const params = this.extractParams(req.path, route.pattern) || {};
        
        // Execute before hooks
        if (route.before) {
          const canContinue = await route.before(req, res);
          if (canContinue === false) return;
        }
        
        // Get template and data
        const template = await this.getRouteTemplate(route);
        const data = await this.executeRouteData(route, params, req);
        
        // Compile and send
        const content = this.engine.template 
          ? await this.engine.template.compile(template, data)
          : template;
          
        res.send(content);
        
        // Execute after hooks
        if (route.after) {
          await route.after(req, res);
        }
      } catch (err) {
        console.error(`Route error ${route.path}:`, err);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  setupExpressApiRoute(app, apiRoute) {
    const method = apiRoute.method.toLowerCase();
    const middlewares = apiRoute.middleware || [];
    
    app[method](apiRoute.path, ...middlewares, async (req, res) => {
      try {
        const result = await apiRoute.handler(req, res);
        if (result && !res.headersSent) {
          res.json(result);
        }
      } catch (err) {
        console.error(`API error ${apiRoute.path}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
    });
  }

  extractParams(url, routePattern) {
    const match = url.match(routePattern.pattern);
    if (!match) return null;
    
    const params = {};
    routePattern.params.forEach((paramName, index) => {
      params[paramName] = match[index + 1];
    });
    return params;
  }
}

export default ClovieRouterService;
```

## 🎨 Step 4: Template Service

**Create:** `lib/core/services/template-service.js`

```javascript
import { ServiceProvider } from '../../vendor/jucie-engine.js';

export class ClovieTemplateService extends ServiceProvider {
  static manifest = {
    name: 'Clovie Template Engine',
    namespace: 'template',
    version: '1.0.0',
    defaults: {
      engine: 'handlebars',
      cacheEnabled: true
    }
  };

  initialize({ engine, state }) {
    state.templateCache = new Map();
    state.compiler = this.config.compiler || this.getDefaultCompiler();
  }

  actions({ engine, state }) {
    return {
      compile: (template, data) => {
        return state.compiler(template, data);
      },

      compileFile: async (filePath, data) => {
        let template;
        
        if (this.config.cacheEnabled && state.templateCache.has(filePath)) {
          template = state.templateCache.get(filePath);
        } else {
          template = await fs.readFile(filePath, 'utf8');
          if (this.config.cacheEnabled) {
            state.templateCache.set(filePath, template);
          }
        }
        
        return this.compile(template, data);
      },

      clearCache: () => {
        state.templateCache.clear();
      }
    };
  }

  getDefaultCompiler() {
    // Default Handlebars compiler
    return (template, data) => {
      try {
        const Handlebars = require('handlebars');
        const compiled = Handlebars.compile(template);
        return compiled(data);
      } catch (err) {
        console.warn(`Template compilation error: ${err.message}`);
        return template;
      }
    };
  }
}
```

## 🚀 Step 5: Update Main Clovie Class

**Edit:** `lib/main.js`

```javascript
import { ClovieEngine } from './core/engine.js';

export default class Clovie {
  constructor(config) {
    // Existing config setup...
    
    // Initialize jucie-engine based architecture
    this.engine = new ClovieEngine(this.config);
    
    // Legacy router for backwards compatibility
    this.router = new ClovieRouter(this.config, this);
  }
  
  async build() {
    // Initialize engine services
    await this.engine.initialize();
    
    // Use service-based approach if available
    if (this.engine.router) {
      // Register routes from config
      if (this.config.routes) {
        this.config.routes.forEach(route => {
          this.engine.router.addRoute(route);
        });
      }
      
      // Generate static pages using services
      if (this.config.mode === 'static') {
        const servicePages = await this.engine.router.generateStatic();
        this.rendered = { ...this.rendered, ...servicePages };
      }
    }
    
    // Rest of existing build logic...
  }
}
```

## 🔧 Step 6: Service Configuration

**Example usage in user's clovie.config.js:**

```javascript
export default {
  mode: 'live',
  
  // jucie-engine services configuration
  services: {
    router: {
      mode: 'live',
      middleware: ['logging', 'auth']
    },
    template: {
      engine: 'handlebars',
      cacheEnabled: true
    },
    auth: {
      provider: 'jwt',
      secret: process.env.JWT_SECRET
    }
  },
  
  // Routes now have access to full service ecosystem
  routes: [
    {
      path: '/admin/:action',
      name: 'admin',
      view: 'admin.html',
      data: async (params, req) => {
        // Use services through engine
        const user = await req.engine.auth.getCurrentUser();
        const data = await req.engine.db.query('SELECT * FROM admin_data');
        return { user, data, action: params.action };
      },
      services: ['auth', 'db'] // Declare service dependencies
    }
  ]
};
```

## 🎁 Benefits of This Approach

### ✅ **For You:**
- **Private code stays private** - jucie-engine bundled, source never exposed
- **Best of both worlds** - robust architecture + public distribution  
- **No licensing issues** - you control both projects
- **Gradual migration** - current Clovie API still works

### ✅ **For Clovie Users:**
- **Simple by default** - works without knowing about services
- **Powerful when needed** - full service architecture available
- **Familiar patterns** - middleware, dependency injection, lifecycle hooks
- **Enterprise ready** - scales from simple sites to complex applications

### ✅ **For Architecture:**
- **Modular design** - each feature is a service
- **Dependency injection** - clean, testable code
- **Middleware chains** - powerful request/response processing
- **Lifecycle management** - proper setup/teardown

## 🔮 Advanced Example

Here's how powerful this becomes:

```javascript
// User's clovie.config.js
export default {
  mode: 'live',
  
  services: {
    auth: { provider: 'jwt' },
    cache: { ttl: 300000 },
    db: { connectionString: process.env.DATABASE_URL },
    analytics: { enabled: true }
  },
  
  routes: [
    {
      path: '/api/posts/:id',
      name: 'get-post',
      data: async (params, req) => {
        // Services automatically available via engine
        const cached = await req.engine.cache.get(`post:${params.id}`);
        if (cached) return cached;
        
        const post = await req.engine.db.query('SELECT * FROM posts WHERE id = ?', [params.id]);
        await req.engine.cache.set(`post:${params.id}`, post);
        
        // Analytics service tracks the access
        req.engine.analytics.track('post_viewed', { postId: params.id });
        
        return post;
      },
      services: ['cache', 'db', 'analytics'],
      middleware: [
        'auth.requireLogin',  // Service-based middleware
        'analytics.trackRequest'
      ]
    }
  ]
};
```

## 🎯 Next Steps

1. **Create the bundle** in jucie-engine project
2. **Copy bundle to** `clovie/lib/vendor/jucie-engine.js`
3. **Create service layer** as shown above
4. **Update main Clovie class** to use engine
5. **Test with simple service** to verify integration
6. **Gradually migrate** existing features to services

This gives you a **private, powerful framework** driving a **public, simple tool** - the perfect combination! 🚀