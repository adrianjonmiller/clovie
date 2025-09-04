import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

export class DevServer {
  constructor(clovieInstance, port = 3000) {
    this.clovie = clovieInstance;
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    this.isRunning = false;
  }
  
  start() {
    if (this.isRunning) return;
    
    // Serve static files from output directory
    this.app.use(express.static(this.clovie.config.outputDir));
    
    // Explicitly handle root path to serve index.html
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(this.clovie.config.outputDir, 'index.html'));
    });
    
    // Handle paths without trailing slash by redirecting
    this.app.get('*', (req, res, next) => {
      if (!req.path.endsWith('/') && !req.path.includes('.')) {
        // Redirect paths without trailing slash to include it
        res.redirect(req.path + '/');
        return;
      }
      next();
    });
    
    // Serve source files for debugging
    if (this.clovie.config.views) {
      this.app.use('/source/views', express.static(this.clovie.config.views));
    }
    if (this.clovie.config.scriptsDir) {
      this.app.use('/source/scripts', express.static(this.clovie.config.scriptsDir));
    }
    if (this.clovie.config.stylesDir) {
      this.app.use('/source/styles', express.static(this.clovie.config.stylesDir));
    }
    
    // WebSocket for live reload
    this.io.on('connection', (socket) => {
      console.log('🔌 Client connected');
      
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected');
      });
    });
    
    // Add cache-busting headers for development
    this.app.use((req, res, next) => {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      next();
    });
    
    // Start server
    this.server.listen(this.port, () => {
      this.isRunning = true;
      console.log(`🌐 Development server running at http://localhost:${this.port}`);
      console.log(`📁 Serving files from: ${this.clovie.config.outputDir}`);
      console.log(`🔌 Live reload enabled`);
    });
    
    // Handle server shutdown
    process.on('SIGINT', () => {
      this.stop();
    });
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.server.close(() => {
      this.isRunning = false;
      console.log('🛑 Development server stopped');
    });
  }
  
  // Notify clients to reload
  notifyReload() {
    if (this.io) {
      this.io.emit('reload');
      console.log('🔄 Live reload triggered');
    }
  }
  
  // Get server info
  getInfo() {
    return {
      port: this.port,
      isRunning: this.isRunning,
              outputDir: this.clovie.config.outputDir
    };
  }
}
