import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ServiceProvider } from '@brickworks/engine';

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

  static manifest = {
    name: 'Clovie Server',
    namespace: 'server',
    version: '1.0.0'
  };
  

  async initialize(useContext, config) {
    if (this.#isRunning) return;

    this.#app = express();
    this.#server = createServer(this.#app);
    this.#isRunning = false;

    // Serve static files from output directory
    this.#app.use(express.static(config.outputDir));
    
    // Explicitly handle root path to serve index.html
    this.#app.get('/', (req, res) => {
      res.sendFile(path.join(config.outputDir, 'index.html'));
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
  
    
    // Store config values
    this.#port = config.port || 3000;
    this.#outputDir = config.outputDir;
    
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