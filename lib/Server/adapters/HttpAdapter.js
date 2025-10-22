/**
 * HTTP Adapter for Node.js native HTTP server
 * Thin I/O shim: normalize req/res, call kernel, send response
 */
import http from 'node:http';
import { AdapterInterface } from './AdapterInterface.js';
import { parseBody } from '../utils/httpParsing.js';

export class HttpAdapter extends AdapterInterface {
  #connections = new Set();

  constructor() {
    super('http');
  }

  async initialize(kernel, opts = {}, log = null) {
    await super.initialize(kernel, opts, log);
    
    // Warn if middleware is configured for HTTP adapter
    if (opts.middleware?.length > 0) {
      log?.warn('Middleware configured but HTTP adapter selected. Consider using adapter: "express" for full middleware support.');
      log?.info('HTTP adapter will simulate middleware using hooks for basic compatibility.');
    }
  }

  async start({ port = 3000, host = '0.0.0.0' } = {}) {
    this.server = http.createServer(async (req, res) => {
      try {
        // Simulate middleware execution for HTTP adapter
        if (this.opts.middleware?.length > 0) {
          const success = await this.#simulateMiddleware(req, res, this.opts.middleware);
          if (!success) return; // Response was sent by middleware
        }

        // Parse body for HTTP adapter
        if (!req.body) {
          req.body = await parseBody(req);
        }

        const ctx = this.createContext(req, res);
        const out = await this.kernel.handle(ctx);
        await this.sendResponse(res, out, req.method === 'HEAD');
      } catch (error) {
        await this.handleError(res, error);
      }
    });

    // Track connections for clean shutdown
    this.server.on('connection', (conn) => {
      this.#connections.add(conn);
      conn.on('close', () => {
        this.#connections.delete(conn);
      });
    });

    await new Promise((resolve, reject) =>
      this.server.listen(port, host, err => (err ? reject(err) : resolve()))
    );

    this.log?.info?.(`HTTP Server listening on http://${host}:${port}`);
    return this.server;
  }

  async stop() {
    if (this.server) {
      // Destroy all active connections
      for (const conn of this.#connections) {
        conn.destroy();
      }
      this.#connections.clear();

      // Close the server
      await new Promise(resolve => this.server.close(() => resolve()));
      this.server = null;
    }
  }

  /**
   * Simulate Express middleware for HTTP adapter
   * Limited compatibility - not all Express middleware will work
   * @private
   */
  async #simulateMiddleware(req, res, middlewareArray) {
    for (const middleware of middlewareArray) {
      try {
        let nextCalled = false;
        const next = (err) => {
          if (err) throw err;
          nextCalled = true;
        };

        // Add Express-like methods to response
        if (!res.json) {
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return false; // Indicates response was sent
          };
        }

        await middleware(req, res, next);
        
        // If next wasn't called and response was sent, stop processing
        if (!nextCalled && res.headersSent) {
          return false;
        }
      } catch (error) {
        this.log?.error(`Middleware simulation error: ${error.message}`);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return false;
      }
    }
    return true; // Continue to kernel
  }

}
