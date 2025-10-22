/**
 * Express adapter for Clovie with full middleware support
 */
import { AdapterInterface } from './AdapterInterface.js';

export class ExpressAdapter extends AdapterInterface {
  #connections = new Set();

  constructor(express = null) {
    super('express');
    this.express = express;
    this.app = null;
  }

  async initialize(kernel, opts = {}, log = null) {
    await super.initialize(kernel, opts, log);
    
    // Import Express
    if (!this.express) {
      try {
        this.express = await import('express');
        this.express = this.express.default;
      } catch (error) {
        throw new Error('Express not installed. Run: npm install express');
      }
    }

    // Create Express app
    this.app = this.express();

    // Apply default middleware (can be overridden by user middleware)
    if (!opts.middleware || !this.#hasBodyParser(opts.middleware)) {
      this.app.use(this.express.json());
      this.app.use(this.express.urlencoded({ extended: true }));
    }

    // Apply user-defined middleware
    if (opts.middleware && Array.isArray(opts.middleware)) {
      this.log?.info(`Applying ${opts.middleware.length} middleware functions`);
      
      for (const [index, middleware] of opts.middleware.entries()) {
        try {
          this.app.use(middleware);
          this.log?.debug(`Applied middleware ${index + 1}/${opts.middleware.length}`);
        } catch (error) {
          throw new Error(`Failed to apply middleware[${index}]: ${error.message}`);
        }
      }
    }

    // Add catch-all route to delegate to kernel
    this.app.all('*', async (req, res) => {
      await this.handleRequest(req, res);
    });
  }

  async start({ port = 3000, host = '0.0.0.0' } = {}) {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, (err) => {
        if (err) {
          reject(err);
        } else {
          // Track connections for clean shutdown
          this.server.on('connection', (conn) => {
            this.#connections.add(conn);
            conn.on('close', () => {
              this.#connections.delete(conn);
            });
          });

          this.log?.info(`Express Server with middleware listening on http://${host}:${port}`);
          resolve(this.server);
        }
      });
    });
  }

  async stop() {
    if (this.server?.close) {
      // Destroy all active connections
      for (const conn of this.#connections) {
        conn.destroy();
      }
      this.#connections.clear();

      return new Promise((resolve) => {
        this.server.close(() => {
          this.log?.info('Express Server stopped');
          resolve();
        });
      });
    }
  }

  async handleRequest(req, res) {
    try {
      // Create context from Express request
      const ctx = this.createContext(req, res);
      
      // Delegate to kernel for route matching and handling
      const response = await this.kernel.handle(ctx);
      
      // Send response using shared method
      await this.sendResponse(res, response, req.method === 'HEAD');

    } catch (error) {
      await this.handleError(res, error);
    }
  }

  /**
   * Check if middleware array contains body parser
   * @private
   */
  #hasBodyParser(middlewareArray) {
    return middlewareArray.some(mw => {
      // Check for common body parser middleware names
      const name = mw.name?.toLowerCase() || mw.toString().toLowerCase();
      return name.includes('json') || name.includes('urlencoded') || name.includes('bodyparser');
    });
  }
}
