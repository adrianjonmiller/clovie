/**
 * Built-in HTTP adapter for Clovie kernel
 */
import http from 'node:http';
import { AdapterInterface, ClovieRoute, ClovieHooks, ClovieContext } from './AdapterInterface.js';
import { matchRoute } from '../utils/routeParams.js';

export class HttpAdapter extends AdapterInterface {
  constructor() {
    super('http');
    this.logger = null;
  }

  async initialize(routes, hooks, useContext) {
    this.routes = routes;
    this.hooks = hooks || {};
    this.useContext = useContext;
    this.logger = useContext('log');
  }

  async start(opts) {
    const { port = 3000, host = '0.0.0.0' } = opts;
    
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    
    return new Promise((resolve, reject) => {
      this.server.listen(port, host, (err) => {
        if (err) {
          reject(err);
        } else {
          this.logger?.info(`HTTP Server listening on http://${host}:${port}`);
          resolve(this.server); // Return the server instance
        }
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.logger?.info('HTTP Server stopped');
          this.server = null;
          resolve();
        });
      });
    }
  }

  async handleRequest(req, res) {
    let context;
    try {
      // Get state and stable from useContext
      const [state, stable] = this.useContext('state', 'stable');
      
      // Create context from Node.js request
      context = this.createContext(req, res, state, stable);
      
      // Parse URL to get pathname
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      // Find matching route using pathname (not full URL)
      const route = this.findRoute(req.method, url.pathname);
      
      if (!route) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      // Extract route parameters and update context
      const params = this.extractParams(route.path, url.pathname);
      context.req.params = params;

      // Execute hooks
      await this.hooks.onRequest?.(context);
      await this.hooks.preHandler?.(context);

      // Execute route handler
      const response = await route.handler(context);
      
      // Execute onSend hook
      await this.hooks.onSend?.(context, response);

      // Send response
      this.sendResponse(res, response);

    } catch (error) {
      const errorResponse = await this.hooks.onError?.(context, error) || {
        type: 'text',
        status: 500,
        body: 'Internal Server Error'
      };
      
      if (!res.headersSent) {
        this.sendResponse(res, errorResponse);
      }
    }
  }

  createContext(req, res, state, stable) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    const clovieReq = {
      method: req.method,
      url: url.toString(),
      path: url.pathname,
      params: {}, // Will be populated by route matching
      query: Object.fromEntries(url.searchParams),
      headers: req.headers,
      body: req.body,
      raw: { req, res }
    };
    
    return new ClovieContext(clovieReq, res, state, stable);
  }

  findRoute(method, pathname) {
    for (const route of this.routes) {
      if (route.method === method && this.matchPath(route.path, pathname)) {
        return route;
      }
    }
    return null;
  }

  matchPath(routePath, urlPath) {
    // Use the existing route matching logic
    const match = matchRoute(routePath, urlPath);
    return match !== null;
  }

  extractParams(routePath, urlPath) {
    // Use the existing route matching logic to extract parameters
    const match = matchRoute(routePath, urlPath);
    return match ? match.params : {};
  }

  sendResponse(res, response) {
    if (!response) return;

    // Set headers
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        res.setHeader(key, value);
      }
    }

    // Set status
    res.statusCode = response.status || 200;

    // Send body based on type
    switch (response.type) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.body));
        break;
      case 'text':
        // Set Content-Type header if not already provided
        const hasContentType = response.headers && response.headers['Content-Type'];
        if (!hasContentType) {
          res.setHeader('Content-Type', 'text/plain');
        }
        res.end(response.body);
        break;
      case 'html':
        res.setHeader('Content-Type', 'text/html');
        res.end(response.body);
        break;
      case 'file':
        // For file responses, you'd typically use res.sendFile() or similar
        res.end('File response not implemented in HTTP adapter');
        break;
      case 'stream':
        res.end(response.body);
        break;
      default:
        res.end(response.body || '');
    }
  }
}
