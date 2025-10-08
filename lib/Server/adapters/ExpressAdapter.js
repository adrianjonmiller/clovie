/**
 * Express adapter for Clovie kernel
 */
import { AdapterInterface, RespondHelpers } from './AdapterInterface.js';

export class ExpressAdapter extends AdapterInterface {
  #connections = new Set();

  constructor(express = null) {
    super('express');
    this.express = express;
    this.app = null;
    this.logger = null;
  }

  async initialize(kernel, services) {
    await super.initialize(kernel, services);
    
    // Try to import Express if not provided
    if (!this.express) {
      try {
        this.express = await import('express');
      } catch (error) {
        throw new Error('Express not installed. Run: npm install express');
      }
    }

    this.app = this.express.default || this.express;

    // Add middleware
    this.app.use(this.express.json());
    this.app.use(this.express.urlencoded({ extended: true }));
  }

  async start(opts) {
    const { port = 3000, host = '0.0.0.0' } = opts;
    
    // Add catch-all route to delegate to kernel
    this.app.all('*', async (req, res) => {
      await this.handleRequest(req, res);
    });
    
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

          this.log?.info(`Express Server listening on http://${host}:${port}`);
          resolve(this.server);
        }
      });
    });
  }

  async stop() {
    if (this.server && this.server.close) {
      // Destroy all active connections
      for (const conn of this.#connections) {
        conn.destroy();
      }
      this.#connections.clear();

      // Close the server
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
}
