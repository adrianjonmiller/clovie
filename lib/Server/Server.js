import { ServiceProvider } from '@brickworks/engine';
import { Kernel } from './Kernel.js';
import { HttpAdapter } from './adapters/HttpAdapter.js';
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

  actions(useContext) {    
    return {
      // Add a route
      add: (method, path, handler, meta = {}) => {
        this.#routes.push({
          method: method.toUpperCase(),
          path,
          handler,
          meta
        });
      },

      // Set server adapter
      useAdapter: (adapter) => {
        this.#adapter = adapter;
        return this;
      },

      // Configure hooks
      hooks: (hooks) => {
        this.#hooks = { ...this.#hooks, ...hooks };
        return this;
      },

      // Start listening server
      listen: async (opts = {}) => {
        const relay = useContext('relay');
        const port = opts.port || 3000;
        const host = opts.host || '0.0.0.0';
        const log = useContext('log');
        
        // Create kernel with services
        const kernel = new Kernel({
          state: useContext('state'),
          stable: useContext('stable'),
          // Add other services as needed for ISR/static/SSR
        });

        // Configure kernel hooks
        kernel.hooks(this.#hooks);

        // 1) Register app routes first
        kernel.registerRoutes(this.#routes);

        // 2) Add system routes (won't shadow user routes)
        kernel.registerRoutes([
          {
            method: 'GET',
            path: '/health',
            handler: (ctx) => ctx.respond.json({
              status: 'ok',
              timestamp: new Date().toISOString(),
              mode: opts.mode || 'production'
            })
          },
          {
            method: 'GET',
            path: '/api/info',
            handler: (ctx) => ctx.respond.json({
              name: 'Clovie',
              version: '1.0.0',
              mode: opts.mode || 'production',
              routes: this.#routes.length
            })
          }
        ]);

        // 3) Configure static file serving as 404 fallback
        if (opts.outputDir) {
          kernel.setStaticFallback(opts.outputDir, (ctx, outputDir) => {
            return this.#serveStaticFile(ctx, outputDir);
          });
        }

        // 4) Boot adapter
        this.#adapter = this.#adapter ?? HttpAdapter.create();
        await this.#adapter.initialize(kernel, log);
        
        // Start the server and return the instance
        const server = await this.#adapter.start({ port, host });
        
        // Check for LiveReload service and initialize it if available
        try {
          const liveReload = useContext('liveReload');
          log.debug(`LiveReload service found: ${!!liveReload}, mode: ${opts.mode}`);
          if (liveReload && opts.mode === 'development') {
            log.info('Initializing LiveReload...');
            await liveReload.initializeServer(server, opts);
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
          mode: opts.mode || 'production' 
        }, log);
        
        // Broadcast server ready event
        relay.broadcast('server:ready', server);
        return server;
      },

      // Get all routes
      getRoutes: () => this.#routes,

      // Clear all routes (useful for testing)
      clearRoutes: () => {
        this.#routes = [];
      },

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
      let filePath = path.join(outputDir, requestPath);
      let stats;
      
      try {
        // Try the path as-is first
        stats = await fs.stat(filePath);
      } catch (error) {
        // If it fails and has no extension, try adding .html
        const ext = path.extname(requestPath);
        if (!ext) {
          const htmlPath = path.join(outputDir, `${requestPath}.html`);
          try {
            stats = await fs.stat(htmlPath);
            filePath = htmlPath; // Use the .html version
          } catch (htmlError) {
            // Neither worked, return 404
            return context.respond.text('Not Found', 404);
          }
        } else {
          // Had an extension but file not found
          return context.respond.text('Not Found', 404);
        }
      }
      
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