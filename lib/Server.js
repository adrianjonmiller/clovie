import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { ServiceProvider } from '@brickworks/engine';

export class Server extends ServiceProvider {

  #app;
  #httpServer;
  #isRunning;
  #port;
  #outputDir;

  static manifest = {
    name: 'Clovie Server',
    namespace: 'server',
    version: '1.0.0'
    // Routes is already installed by the main engine, no need to declare as dependency
  };

  async initialize(useContext) {
    const { clovieConfig, routes } = useContext();

    clovieConfig.onReady((config) => {
      this.#port = config.port || 3000;
      this.#outputDir = config.outputDir || './dist';
    })
  }
  
  getters(useContext) {
    return {
      app: () => {
        return this.#app;
      },
      httpServer: () => {
        return this.#httpServer;
      }
    }
  }

  actions(useContext) {
    const { clovieConfig, routes } = useContext();
    return {
      start: () => {
        if (this.#isRunning) {
          console.log('🔄 Server is already running');
          return;
        }

        this.#initializeServer(clovieConfig.get(), routes);
        
        this.#httpServer.listen(this.#port, () => {
          this.#isRunning = true;
          console.log(`🌐 Development server running at http://localhost:${this.#port}`);
          console.log(`📁 Serving files from: ${this.#outputDir}`);
        });
      },
      stop: () => {
        if (!this.#isRunning) return;
        
        this.#httpServer.close(() => {
          this.#isRunning = false;
          console.log('🛑 Development server stopped');
        });
      },
      getInfo: () => {
        return {
          port: this.#port,
          isRunning: this.#isRunning,
          outputDir: this.#outputDir
        };
      },

      reinitialize: async () => {
        console.log('🔄 Reinitializing server with new configuration...');
        
        // Get fresh config
        const config = clovieConfig.get();
        
        // Completely tear down the existing server
        await this.#tearDownServer();
        
        // Update stored config values
        this.#port = config.port || 3000;
        this.#outputDir = config.outputDir;
        
        // Reinitialize server with new config
        await this.#initializeServer(config, routes);
        
        console.log('✅ Server reinitialized successfully');
      }
    }
  }

  async #initializeServer(config, routesService) {
    console.log('🌐 Starting Express server...');
    
    // Step 1: Create basic Express app
    this.#app = express();
    this.#httpServer = createServer(this.#app);
    this.#isRunning = false;

    // Store config values
    this.#port = config.port || 3000;
    this.#outputDir = config.outputDir;
    
    // Step 2: Setup basic middleware
    this.#setupBasicMiddleware(config);
    
    // Step 3: Serve static files from dist directory
    this.#setupStaticServing(config);
    
    // Step 5: Setup development features
    await this.#setupDev(config);
    
    // Handle server shutdown
    this.#setupShutdownHandlers();
  }

  #setupBasicMiddleware(config) {
    console.log('🔧 Setting up basic middleware...');
    
    // Basic Express middleware
    this.#app.use(express.json());
    this.#app.use(express.urlencoded({ extended: true }));
    
    // Development cache-busting headers
    this.#app.use((req, res, next) => {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      next();
    });
    
    console.log('   ✅ Basic middleware configured');
  }

  #setupStaticServing(config) {
    console.log('📁 Setting up static file serving...');
    
    if (config.outputDir && fs.existsSync(config.outputDir)) {
      // Serve static files from dist directory
      this.#app.use(express.static(config.outputDir));
      
      // Explicitly handle root path to serve index.html
      this.#app.get('/', (req, res) => {
        const indexPath = path.join(config.outputDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('index.html not found');
        }
      });
      
      console.log(`   ✅ Serving static files from: ${config.outputDir}`);
    } else {
      console.log('   ⚠️  No output directory configured or it does not exist');
    }
  }

  #setupShutdownHandlers() {
    console.log('🛑 Setting up shutdown handlers...');
    
    process.on('SIGINT', () => {
      if (!this.#isRunning) return;
        
      this.#httpServer.close(() => {
        this.#isRunning = false;
        console.log('🛑 Development server stopped');
      });
    });
    
    console.log('   ✅ Shutdown handlers configured');
  }

  async #setupDev(config) {
    console.log('🔧 Setting up development features...');
    
    // Serve source files for debugging
    if (config.views) {
      this.#app.use('/source/views', express.static(config.views));
      console.log('   📂 Source views available at /source/views');
    }
    if (config.scripts) {
      this.#app.use('/source/scripts', express.static(config.scripts));
      console.log('   📂 Source scripts available at /source/scripts');
    }
    if (config.styles) {
      this.#app.use('/source/styles', express.static(config.styles));
      console.log('   📂 Source styles available at /source/styles');
    }
  }

  async #tearDownServer() {
    console.log('🛑 Tearing down existing server...');
    
    // Close HTTP server
    if (this.#httpServer && this.#isRunning) {
      return new Promise((resolve) => {
        this.#httpServer.close(() => {
          console.log('   ✅ HTTP server closed');
          this.#isRunning = false;
          this.#httpServer = null;
          this.#app = null;
          resolve();
        });
        
        // Force close after timeout
        setTimeout(() => {
          if (this.#httpServer) {
            this.#httpServer.close();
            this.#isRunning = false;
            this.#httpServer = null;
            this.#app = null;
            console.log('   ⚠️  Server force closed after timeout');
            resolve();
          }
        }, 1000);
      });
    }
    
    // Reset state
    this.#isRunning = false;
    this.#httpServer = null;
    this.#app = null;
    
    console.log('   ✅ Server teardown complete');
  }
}