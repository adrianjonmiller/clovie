import { ServiceProvider } from '@brickworks/engine';
import { parseRouteParams } from './utils/routeParams.js';
import { HttpAdapter } from './adapters/http.js';
import { displayServerReady } from './utils/serverReady.js';

export class Server extends ServiceProvider {
  static manifest = {
    name: 'Clovie Server',
    namespace: 'server',
    version: '1.0.0'
  };

  #routes = [];
  #adapter = null;
  #hooks = {
    onRequest: null,
    preHandler: null,
    onSend: null,
    onError: null
  };

  initialize(_, config) {
    this.#routes.push({
      method: 'GET',
      path: '/health',
      handler: async (context) => {
        return context.respond.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          mode: config.mode || 'production'
        });
      },
      params: []
    });

    // Add API info endpoint
    this.#routes.push({
      method: 'GET',
      path: '/api/info',
      handler: async (context) => {
        return context.respond.json({
          name: 'Clovie',
          version: '1.0.0',
          mode: config.mode || 'production',
          routes: this.#routes.length
        });
      },
      params: []
    });

    // Serve static files from outputDir (wildcard route last)
    if (config.outputDir) {
      this.#routes.push({
        method: 'GET',
        path: '/*',
        handler: async (context) => {
          return this.#serveStaticFile(context, config.outputDir);
        },
        params: [{ name: 'wild', type: 'string' }]
      });
    }
  }

  actions(useContext) {    
    return {
      // Add a route
      add: (method, path, handler, options = {}) => {
        // Parse route parameters for validation and documentation
        const params = parseRouteParams(path);
        
        this.#routes.push({ 
          method: method.toUpperCase(), 
          path, 
          handler: async (context) => {
            // Inject engine context into handler
            context.useContext = useContext;
            return await handler(context);
          },
          params,
          ...options // Allow additional options like paramTypes, validation, etc.
        });
      },

      // Set server adapter
      useAdapter: (adapter) => {
        this.#adapter = adapter;
        return this;
      },

      // Configure hooks
      hooks: (hooks) => {
        Object.assign(this.#hooks, hooks);
        return this;
      },

      // Start listening server
      listen: async (opts = {}) => {
        const relay = useContext('relay');
        const port = opts.port || opts || 3000;
        const host = opts.host || '0.0.0.0';
        const log = useContext('log');
        
        // Use HTTP adapter by default if none set
        if (!this.#adapter) {
          this.#adapter = new HttpAdapter();
        }

        // Initialize adapter with routes, hooks, and useContext
        await this.#adapter.initialize(this.#routes, this.#hooks, useContext);
        
        // Start the server and return the instance
        const server = await this.#adapter.start({ port, host });
        
        // Check for LiveReload service and initialize it if available
        try {
          const liveReload = useContext('liveReload');
          log.debug(`LiveReload service found: ${!!liveReload}, mode: ${this.config?.mode}`);
          if (liveReload && this.config?.mode === 'development') {
            log.info('Initializing LiveReload...');
            await liveReload.initializeServer(server);
            log.info('LiveReload initialized successfully');
          }
        } catch (error) {
          log.debug('LiveReload not available:', error.message);
        }
        
        // Display pretty server ready message
        const actualPort = server.address()?.port || port;
        await displayServerReady({ 
          port: actualPort, 
          host, 
          mode: this.config.mode || 'production' 
        }, log);
        
        // Broadcast server ready event
        relay.broadcast('server:ready', server);
        return server;
      },

      // Get all routes
      getRoutes: () => this.#routes,

      // Stop the server
      stop: async () => {
        if (this.#adapter) {
          await this.#adapter.stop();
        }
      },

      // Check if server is running
      isRunning: () => this.#adapter && this.#adapter.isRunning(),

      // Get the underlying HTTP server (for Socket.IO integration)
      getHttpServer: () => {
        if (this.#adapter) {
          return this.#adapter.getHttpServer();
        }
        return null;
      },

      // Legacy support for direct HTTP handling
      handle: async (req, res) => {
        // Create a temporary HTTP adapter for legacy support
        const tempAdapter = new HttpAdapter();
        await tempAdapter.initialize(this.#routes, this.#hooks, useContext);
        return tempAdapter.handleRequest(req, res);
      }
    };
  }


  /**
   * Serve static files from the output directory
   * @private
   */
  async #serveStaticFile(context, outputDir) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Get the requested file path
      const requestPath = context.req.path === '/' ? '/index.html' : context.req.path;
      const filePath = path.join(outputDir, requestPath);
      
      // Check if file exists
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        // Determine content type
        const ext = path.extname(filePath);
        const contentType = this.#getContentType(ext);
        
        // Read and serve the file
        const content = await fs.readFile(filePath);
        
        // Serve with correct content type
        if (contentType === 'text/html') {
          return context.respond.html(content.toString(), 200);
        } else if (contentType === 'text/css') {
          return context.respond.text(content.toString(), 200, { 'Content-Type': 'text/css' });
        } else if (contentType === 'application/javascript') {
          return context.respond.text(content.toString(), 200, { 'Content-Type': 'application/javascript' });
        } else if (contentType.startsWith('text/')) {
          return context.respond.text(content.toString(), 200, { 'Content-Type': contentType });
        } else {
          // For binary files, send as file response
          return context.respond.file(filePath, 200, { 'Content-Type': contentType });
        }
      } else {
        return context.respond.text('Not Found', 404);
      }
    } catch (error) {
      return context.respond.text('Not Found', 404);
    }
  }

  /**
   * Get content type based on file extension
   * @private
   */
  #getContentType(ext) {
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    return types[ext.toLowerCase()] || 'application/octet-stream';
  }

}
