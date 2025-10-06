/**
 * Express adapter for Clovie kernel
 */
import { AdapterInterface, RespondHelpers } from './AdapterInterface.js';

export class ExpressAdapter extends AdapterInterface {
  constructor(express = null) {
    super('express');
    this.express = express;
    this.app = null;
    this.logger = null;
  }

  async initialize(routes, hooks, useContext) {
    this.logger = useContext('log');
    
    // Try to import Express if not provided
    if (!this.express) {
      try {
        this.express = await import('express');
      } catch (error) {
        throw new Error('Express not installed. Run: npm install express');
      }
    }

    this.app = this.express.default || this.express;
    this.hooks = hooks || {};
    this.useContext = useContext;

    // Add middleware
    this.app.use(this.express.json());
    this.app.use(this.express.urlencoded({ extended: true }));

    // Register routes
    for (const route of routes) {
      this.app[route.method.toLowerCase()](route.path, async (req, res) => {
        await this.handleRequest(req, res, route);
      });
    }
  }

  async start(opts) {
    const { port = 3000, host = '0.0.0.0' } = opts;
    
    return new Promise((resolve, reject) => {
      this.app.listen(port, host, (err) => {
        if (err) {
          reject(err);
        } else {
          this.logger?.info(`Express Server listening on http://${host}:${port}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    if (this.app && this.app.close) {
      return new Promise((resolve) => {
        this.app.close(() => {
          this.logger?.info('Express Server stopped');
          resolve();
        });
      });
    }
  }

  async handleRequest(req, res, route) {
    try {
      // Create context from Express request
      const context = this.createContext(req, res);
      
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

  createContext(req, res) {
    const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`);
    
    return {
      req: {
        method: req.method,
        url: url.toString(),
        path: req.path,
        params: req.params || {},
        query: req.query || {},
        headers: req.headers,
        body: req.body,
        raw: { req, res }
      },
      state: null, // Will be injected by Server
      stable: null, // Will be injected by Server
      respond: new RespondHelpers()
    };
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
    res.status(response.status || 200);

    // Send body based on type
    switch (response.type) {
      case 'json':
        res.json(response.body);
        break;
      case 'text':
        res.type('text/plain').send(response.body);
        break;
      case 'html':
        res.type('text/html').send(response.body);
        break;
      case 'file':
        res.sendFile(response.path);
        break;
      case 'stream':
        res.end(response.body);
        break;
      default:
        res.send(response.body || '');
    }
  }
}
