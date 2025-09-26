/**
 * Service Adapter - Provides service-like functionality with or without jucie-engine
 * If jucie-engine is available, uses it. Otherwise, falls back to basic implementation.
 */
export class ServiceAdapter {
  constructor(config) {
    this.config = config;
    this.engine = null;
    this.services = new Map();
    this.hasJucieEngine = false;
  }

  async initialize() {
    // Try to load jucie-engine if available
    try {
      const jucieModule = await this.tryLoadJucieEngine();
      if (jucieModule) {
        this.hasJucieEngine = true;
        this.engine = jucieModule.Engine.create();
        await this.setupJucieServices(jucieModule);
        console.log('🚀 jucie-engine detected - using full service architecture');
      } else {
        await this.setupBasicServices();
        console.log('📦 Basic mode - using built-in service emulation');
      }
    } catch (err) {
      console.log('ℹ️  jucie-engine not available, using basic mode');
      await this.setupBasicServices();
    }
  }

  async tryLoadJucieEngine() {
    try {
      // Try different import paths
      const paths = [
        'jucie-engine',           // If installed as dependency
        './vendor/jucie-engine.js', // If bundled
        '@jucie/engine'           // If published to npm
      ];

      for (const importPath of paths) {
        try {
          return await import(importPath);
        } catch (e) {
          continue; // Try next path
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  async setupJucieServices(jucieModule) {
    const { ServiceProvider } = jucieModule;
    
    // Create Clovie services using jucie-engine
    class ClovieRouterService extends ServiceProvider {
      static manifest = {
        name: 'Clovie Router',
        namespace: 'router',
        version: '1.0.0'
      };

      actions({ engine, state }) {
        return {
          addRoute: (routeConfig) => this.addRoute(routeConfig),
          generateStatic: () => this.generateStatic(),
          setupExpress: (app) => this.setupExpress(app)
        };
      }

      middleware({ engine, state }) {
        return (action, ctx, next) => {
          console.log(`🛣️  Router service: ${action}`);
          return next();
        };
      }
    }

    await this.engine.install(ClovieRouterService);
  }

  async setupBasicServices() {
    // Fallback implementation without jucie-engine
    this.services.set('router', {
      addRoute: (routeConfig) => {
        console.log(`✅ Route added: ${routeConfig.path}`);
        // Basic implementation
      },
      generateStatic: async () => {
        console.log('📄 Generating static files...');
        return {};
      },
      setupExpress: (app) => {
        console.log('🌐 Setting up Express routes...');
        // Basic Express setup
      }
    });
  }

  // Unified API regardless of backend
  async router(action, ...args) {
    if (this.hasJucieEngine) {
      return await this.engine.router[action](...args);
    } else {
      const service = this.services.get('router');
      return await service[action](...args);
    }
  }

  // Add other service proxies as needed
  async template(action, ...args) {
    if (this.hasJucieEngine && this.engine.template) {
      return await this.engine.template[action](...args);
    }
    // Fallback implementation
    return this.basicTemplate(action, ...args);
  }

  basicTemplate(action, ...args) {
    // Basic template handling without services
    if (action === 'compile') {
      const [template, data] = args;
      return this.config.compiler ? this.config.compiler(template, data) : template;
    }
  }
}

export default ServiceAdapter;