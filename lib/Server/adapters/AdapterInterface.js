/**
 * Clovie Adapter Interface
 * 
 * This defines the contract that all HTTP server adapters must implement.
 * The Clovie kernel uses this interface to delegate HTTP handling to
 * any compatible adapter (Express, Fastify, Node HTTP, etc.)
 */
import { parseQuery } from '../utils/httpParsing.js';

/**
 * Adapter Interface - All adapters must implement this
 */
export class AdapterInterface {
  static create(name) {
    return new this(name);
  }

  constructor(name) {
    this.name = name;
    this.server = null;
    this.kernel = null;
    this.log = null;
    this.hooks = null;
  }

  /**
   * Initialize the adapter with kernel and context
   * @param {Object} kernel - Clovie kernel instance
   * @param {Object} log - Clovie logger
   */
  async initialize(kernel, log) {
    this.kernel = kernel;
    this.log = log;
  }

  /**
   * Start the HTTP server
   * @param {Object} options - Server options (port, host, etc.)
   * @returns {Promise<Object>} - Server instance
   */
  async start(options) {
    throw new Error(`start() must be implemented by ${this.name} adapter`);
  }

  /**
   * Stop the HTTP server
   * @returns {Promise<void>}
   */
  async stop() {
    throw new Error(`stop() must be implemented by ${this.name} adapter`);
  }

  /**
   * Get the underlying HTTP server instance
   * Used by services like LiveReload for Socket.IO integration
   * @returns {Object|null} - HTTP server instance
   */
  getHttpServer() {
    return this.server;
  }

  /**
   * Check if the server is currently running
   * @returns {boolean}
   */
  isRunning() {
    return this.server !== null;
  }

  /**
   * Handle a request through the adapter
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   * @returns {Promise<void>}
   */
  async handleRequest(req, res) {
    throw new Error(`handleRequest() must be implemented by ${this.name} adapter`);
  }

  /**
   * Create standardized context object from request
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   * @returns {Object} - Standardized context object
   */
  createContext(req, res) {
    const url = new URL(req.url || req.originalUrl, `http://${req.headers.host}`);

    return {
      req: {
        method: req.method,
        url: url.toString(),
        path: url.pathname,
        headers: Object.fromEntries(
          Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), v])
        ),
        query: req.query || parseQuery(url.searchParams),
        body: req.body || null,
        raw: { req, res },
        params: {}
      },
      res,
      respond: new RespondHelpers()
    };
  }

  /**
   * Send response using standardized response format
   * @param {Object} res - HTTP response
   * @param {Object} response - Response object from route handler
   * @param {boolean} isHead - Whether this is a HEAD request
   * @returns {Promise<void>}
   */
  async sendResponse(res, response, isHead = false) {
    // Default to 204 if no response object was returned
    const resp = response ?? { type: 'text', status: 204, headers: {}, body: '' };

    if (res.headersSent) return; // defensive guard

    // Set status and headers (normalize keys)
    res.statusCode = resp.status ?? 200;
    if (resp.headers) {
      for (const [k, v] of Object.entries(resp.headers)) {
        res.setHeader(k.toLowerCase(), v);
      }
    }

    // Respect HEAD requests: send headers only
    if (isHead) {
      return res.end();
    }

    switch (resp.type) {
      case 'json': {
        if (!res.getHeader('content-type')) {
          res.setHeader('content-type', 'application/json; charset=utf-8');
        }
        return res.end(JSON.stringify(resp.body));
      }

      case 'text': {
        if (!res.getHeader('content-type')) {
          res.setHeader('content-type', 'text/plain; charset=utf-8');
        }
        return res.end(resp.body ?? '');
      }

      case 'html': {
        if (!res.getHeader('content-type')) {
          res.setHeader('content-type', 'text/html; charset=utf-8');
        }
        return res.end(resp.body ?? '');
      }

      case 'file': {
        return await this.serveFile(res, resp.path);
      }

      case 'stream': {
        const b = resp.body;
        if (!b) return res.end();
        // Node stream
        if (typeof b.pipe === 'function') return b.pipe(res);
        // AsyncIterable
        if (Symbol.asyncIterator in Object(b)) {
          for await (const chunk of b) {
            if (!res.write(chunk)) {
              await new Promise(r => res.once('drain', r));
            }
          }
          return res.end();
        }
        // Fallback
        return res.end(b);
      }

      default:
        return res.end('');
    }
  }

  /**
   * Serve static files with proper MIME types and streaming
   * @param {Object} res - HTTP response
   * @param {string} filePath - Path to file to serve
   * @returns {Promise<void>}
   */
  async serveFile(res, filePath) {
    const fs = await import('node:fs');
    const fsp = await import('node:fs/promises');
    const path = await import('node:path');
    const { pipeline } = await import('node:stream');
    const { promisify } = await import('node:util');
    
    const pipelineAsync = promisify(pipeline);

    const MIME = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };

    try {
      const st = await fsp.stat(filePath);
      if (!st.isFile()) {
        res.statusCode = 404;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        return res.end('Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', MIME[ext] ?? 'application/octet-stream');
      }
      res.setHeader('content-length', String(st.size));

      const rs = fs.createReadStream(filePath);
      rs.on('error', () => {
        if (!res.headersSent) res.statusCode = 404;
        res.end('Not Found');
      });
      await pipelineAsync(rs, res); // backpressure-aware piping
    } catch {
      if (!res.headersSent) {
        res.statusCode = 404;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
      }
      res.end('Not Found');
    }
  }

  /**
   * Handle request errors consistently
   * @param {Object} res - HTTP response
   * @param {Error} error - Error that occurred
   * @returns {Promise<void>}
   */
  async handleError(res, error) {
    this.log?.error?.('Request handling error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('Internal Server Error');
    }
  }
}

/**
 * Route object structure that adapters receive from Clovie kernel
 */
export class ClovieRoute {
  constructor(method, path, handler, options = {}) {
    this.method = method.toUpperCase();
    this.path = path;
    this.handler = handler;
    this.options = options;
    this.params = options.params || [];
  }
}

/**
 * Hook object structure for lifecycle management
 */
export class ClovieHooks {
  constructor() {
    this.onRequest = null;
    this.preHandler = null;
    this.onSend = null;
    this.onError = null;
  }
}

/**
 * Context object passed to route handlers
 */
export class ClovieContext {
  constructor(req, res, state, stable) {
    this.req = req;
    this.res = res;
    this.state = state;
    this.stable = stable;
    this.respond = new RespondHelpers();
  }
}

/**
 * Response helpers for route handlers
 */
export class RespondHelpers {
  json(data, status = 200, headers = {}) {
    return { type: 'json', status, headers, body: data };
  }

  text(data, status = 200, headers = {}) {
    return { type: 'text', status, headers, body: data };
  }

  html(data, status = 200, headers = {}) {
    return { type: 'html', status, headers, body: data };
  }

  file(path, status = 200, headers = {}) {
    return { type: 'file', status, headers, path };
  }

  stream(body, status = 200, headers = {}) {
    return { type: 'stream', status, headers, body };
  }

  redirect(location, status = 302, headers = {}) {
    return { type:'text', status, headers: { ...headers, location }, body: '' };
  }
}
