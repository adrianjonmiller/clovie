# 🔗 jucie-engine + Clovie Integration Plan

## 🎯 Goal
Integrate jucie-engine's service architecture into Clovie to provide:
- Powerful service-based routing
- Middleware system for authentication/logging
- Lifecycle management for complex applications
- Dependency injection for modular architecture

## 🏗️ Architecture Plan

### 1. Core Integration Layer

```
clovie/
├── lib/
│   ├── vendor/
│   │   └── jucie-engine.bundle.js    # Bundled jucie-engine
│   ├── core/
│   │   ├── engine.js                 # Clovie-specific engine wrapper
│   │   ├── services/                 # Built-in Clovie services
│   │   │   ├── router-service.js     # Routing as a service
│   │   │   ├── template-service.js   # Template rendering service
│   │   │   ├── asset-service.js      # Asset processing service
│   │   │   └── server-service.js     # Development server service
│   │   └── router.js                 # Current router (bridge to service)
│   └── main.js                       # Updated Clovie class
```

### 2. Service-Based Routing

Transform current routing into jucie-engine services:

```javascript
// lib/core/services/router-service.js
import { ServiceProvider } from '../vendor/jucie-engine.bundle.js';

class ClovieRouterService extends ServiceProvider {
  static manifest = {
    name: 'Clovie Router',
    namespace: 'router',
    version: '1.0.0',
    dependencies: ['template', 'server']
  };

  actions({ engine, state }) {
    return {
      // Route registration
      addRoute: (routeConfig) => {
        state.routes.push(routeConfig);
        return this.setupRoute(routeConfig);
      },

      // Parameter extraction
      extractParams: (path, pattern) => {
        // Current implementation
      },

      // Static generation
      generateStatic: async () => {
        const pages = {};
        for (const route of state.routes) {
          // Use template service
          const content = await engine.template.render(route);
          pages[route.outputPath] = content;
        }
        return pages;
      }
    };
  }

  middleware({ engine, state }) {
    return (action, ctx, next) => {
      // Route-specific middleware
      console.log(`Router action: ${action}`);
      return next();
    };
  }
}
```

### 3. Configuration Integration

Update clovie.config.js to work with services:

```javascript
// clovie.config.js
export default {
  mode: 'live',
  
  // jucie-engine services configuration
  services: {
    router: {
      enabled: true,
      config: { /* router-specific config */ }
    },
    template: {
      enabled: true,
      config: { engine: 'handlebars' }
    }
  },
  
  // Current routing config still works
  routes: [
    {
      path: '/',
      name: 'home',
      view: 'index.html',
      data: () => ({ title: 'Home' }),
      services: ['auth', 'cache'] // Declare service dependencies
    }
  ]
};
```

## 📦 Bundle Creation Process

### Step 1: Build jucie-engine Bundle

```bash
# In jucie-engine project
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-terser

# rollup.config.js
export default {
  input: 'src/index.js',
  output: {
    file: '../clovie/lib/vendor/jucie-engine.bundle.js',
    format: 'es',
    exports: 'named'
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    terser({ compress: { drop_console: false } })
  ]
};

# Build
npm run build
```

### Step 2: Update Clovie Dependencies

```bash
# In clovie project
npm install --save-dev rollup @rollup/plugin-node-resolve
```

### Step 3: Create Integration Services

The beauty of jucie-engine is that you can gradually migrate Clovie's features into services:

```javascript
// lib/core/services/template-service.js
class ClovieTemplateService extends ServiceProvider {
  static manifest = {
    name: 'Clovie Template Engine',
    namespace: 'template',
    version: '1.0.0'
  };

  actions({ engine, state }) {
    return {
      compile: (template, data) => {
        return this.config.compiler(template, data);
      },
      
      render: async (route, data) => {
        const template = await this.loadTemplate(route.view);
        return this.compile(template, data);
      }
    };
  }
}
```

## 🔄 Migration Strategy

### Phase 1: Bundle Integration
1. ✅ Create rollup bundle of jucie-engine
2. ✅ Import bundled engine in Clovie
3. ✅ Maintain current API compatibility

### Phase 2: Service Conversion
1. 🔄 Convert routing to RouterService
2. 🔄 Convert templates to TemplateService  
3. 🔄 Convert assets to AssetService
4. 🔄 Add middleware system

### Phase 3: Enhanced Features
1. 🔄 Service dependency injection
2. 🔄 Plugin system for users
3. 🔄 Advanced middleware chains
4. 🔄 Lifecycle hooks

## 💡 Benefits

### For Clovie Users
- **Powerful middleware system** for auth, caching, logging
- **Service-based architecture** for complex applications
- **Dependency injection** for clean code organization
- **Plugin ecosystem** potential

### For You
- **Reuse jucie-engine** without making it public
- **Gradual migration** - current API still works
- **Enhanced architecture** - more robust and extensible
- **Private framework, public tool** - best of both worlds

## 🛠️ Implementation Priority

1. **Bundle creation** - Get jucie-engine into Clovie cleanly
2. **Router service** - Convert current routing to use services
3. **Middleware system** - Enable powerful request/response processing
4. **Template service** - Make rendering more flexible
5. **Plugin API** - Allow users to create their own services

This approach lets you leverage jucie-engine's power while keeping Clovie simple for basic use cases, but incredibly powerful for complex applications!