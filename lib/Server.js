import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ServiceProvider } from '@brickworks/engine';
import { Routes } from './Routes.js';

export class Server extends ServiceProvider {

  #app;
  #server;
  #isRunning;
  #port;
  #outputDir;
  #views;
  #scriptsDir;
  #stylesDir;
  #io;
  #config;

  static manifest = {
    name: 'Clovie Server',
    namespace: 'server',
    version: '1.0.0',
    dependencies: [Routes]
  };
  

  async initialize(useContext, config) {
    if (this.#isRunning) return;

    this.#app = express();
    this.#server = createServer(this.#app);
    this.#isRunning = false;
    this.#config = config;

    // Store config values
    this.#port = config.port || 3000;
    this.#outputDir = config.outputDir;
    
    // Check if we're in server type (vs static type)
    const isServerType = config.type === 'server';
    
    if (isServerType) {
      console.log('🌐 Initializing server type...');
      
      // In server type, serve static files from output directory first
      if (config.outputDir) {
        this.#app.use(express.static(config.outputDir));
        console.log(`📁 Serving static files from: ${config.outputDir}`);
      }
      
      // Then setup dynamic routes
      const { routes } = useContext();
      await routes.setupServerRoutes(this.#app);
    } else {
      console.log('📁 Initializing static file server type...');
      // In static mode, serve static files from output directory (if provided)
      if (config.outputDir && fs.existsSync(config.outputDir)) {
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
        
        // Handle paths without trailing slash by redirecting
        this.#app.get('*', (req, res, next) => {
          if (!req.path.endsWith('/') && !req.path.includes('.')) {
            // Redirect paths without trailing slash to include it
            res.redirect(req.path + '/');
            return;
          }
          next();
        });
      } else {
        console.log('⚠️  No output directory configured or it does not exist, serving basic routes only');
      }
    }
    
    // Setup development features
    await this.#setupDev(config);
    
    // Handle server shutdown
    process.on('SIGINT', () => {
      this.stop();
    });
  }

  actions(useContext) {
    return {
      start: () => {
        if (this.#isRunning) {
          console.log('🔄 Server is already running');
          return;
        }
        
        this.#server.listen(this.#port, () => {
          this.#isRunning = true;
          console.log(`🌐 Development server running at http://localhost:${this.#port}`);
          console.log(`📁 Serving files from: ${this.#outputDir}`);
          console.log(`🔌 Live reload enabled`);
        });
      },
      stop: () => {
        if (!this.#isRunning) return;
        
        this.#server.close(() => {
          this.#isRunning = false;
          console.log('🛑 Development server stopped');
        });
      },
      notifyReload: () => {
        if (this.#io) {
          this.#io.emit('reload');
          console.log('🔄 Live reload triggered');
        }
      },
      getInfo: () => {
        return {
          port: this.#port,
          isRunning: this.#isRunning,
          outputDir: this.#outputDir
        };
      }
    }
  }

  async #setupDev(config) {
    // Serve source files for debugging
    if (config.views) {
      this.#app.use('/source/views', express.static(config.views));
    }
    if (config.scriptsDir) {
      this.#app.use('/source/scripts', express.static(config.scriptsDir));
    }
    if (config.stylesDir) {
      this.#app.use('/source/styles', express.static(config.stylesDir));
    }

    // WebSocket for live reload
    // Add cache-busting headers for development
    this.#app.use((req, res, next) => {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      next();
    });

    this.#io = new SocketIOServer(this.#server);
    this.#io.on('connection', (socket) => {
      console.log('🔌 Client connected');
      
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected');
      });
    });
  }
}