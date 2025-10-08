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

  async initialize(kernel, services, log) {
    await super.initialize(kernel, services, log);
  }

  async start({ port = 3000, host = '0.0.0.0' } = {}) {
    this.server = http.createServer(async (req, res) => {
      try {
        // Parse body for HTTP adapter (Express handles this differently)
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

}
