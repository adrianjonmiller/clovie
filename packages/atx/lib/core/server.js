import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

export class DevServer {
  constructor(atxInstance, port = 3000) {
    this.atx = atxInstance;
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    this.isRunning = false;
  }
  
  start() {
    if (this.isRunning) return;
    
    // Serve static files from output directory
    this.app.use(express.static(this.atx.config.outputDir));
    
    // Serve source files for debugging
    if (this.atx.config.views) {
      this.app.use('/source/views', express.static(this.atx.config.views));
    }
    if (this.atx.config.scriptsDir) {
      this.app.use('/source/scripts', express.static(this.atx.config.scriptsDir));
    }
    if (this.atx.config.stylesDir) {
      this.app.use('/source/styles', express.static(this.atx.config.stylesDir));
    }
    
    // WebSocket for live reload
    this.io.on('connection', (socket) => {
      console.log('🔌 Client connected');
      
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected');
      });
    });
    
    // Start server
    this.server.listen(this.port, () => {
      this.isRunning = true;
      console.log(`🌐 Development server running at http://localhost:${this.port}`);
      console.log(`📁 Serving files from: ${this.atx.config.outputDir}`);
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
      outputDir: this.atx.config.outputDir
    };
  }
}
