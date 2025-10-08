import { compileRoute } from './utils/routeMatch.js';

/**
 * Kernel handles route registration and matching
 * Separates routing logic from HTTP protocol handling
 */
export class Kernel {
  #routes = []; // { method, path, match, handler, mode, revalidate, ... }
  #hooks = { 
    onRequest: null, 
    preHandler: null, 
    onSend: null, 
    onError: null 
  };
  #staticFallback = null;

  constructor() { 
  }

  /**
   * Register multiple routes at once
   * @param {Array} rawRoutes - Array of route objects
   */
  registerRoutes(rawRoutes) {
    for (const r of rawRoutes) {
      this.registerRoute(r);
    }
  }

  /**
   * Register a single route
   * @param {Object} route - Route object with method, path, handler, etc.
   */
  registerRoute(route) {
    const compiledRoute = {
      ...route,
      match: compileRoute(route.path)
    };
    this.#routes.push(compiledRoute);
  }

  /**
   * Configure hooks
   * @param {Object} hooks - Hook functions
   */
  hooks(h) { 
    Object.assign(this.#hooks, h); 
  }

  /**
   * Set static file fallback handler
   * @param {string} outputDir - Directory to serve static files from
   * @param {Function} handler - Static file handler function
   */
  setStaticFallback(outputDir, handler) {
    this.#staticFallback = { outputDir, handler };
  }

  /**
   * Handle a request through the routing system
   * @param {Object} ctx - Request context
   * @returns {Object} Response object
   */
  async handle(ctx) {
  let response;
  try {
    // onRequest can short-circuit
    const onReqOut = await this.#hooks.onRequest?.(ctx);
    if (onReqOut) { response = onReqOut; return response; }

    // route match …
    let matchParams = null;
    const route = this.#routes.find(r => {
      if (r.method !== ctx.req.method) return false;
      const m = r.match(ctx.req.path);
      if (m) { matchParams = m; return true; }
      return false;
    });

    if (!route) {
      if (this.#staticFallback) {
        const staticResponse = await this.#staticFallback.handler(ctx, this.#staticFallback.outputDir);
        response = (staticResponse && staticResponse.status !== 404)
          ? staticResponse
          : ctx.respond.text('Not Found', 404);
      } else {
        response = ctx.respond.text('Not Found', 404);
      }
      return response;
    }

    ctx.req.params = matchParams || {};

    // preHandler can short-circuit
    const preOut = await this.#hooks.preHandler?.(ctx, route);
    if (preOut) { response = preOut; return response; }

    // route handler
    response = await route.handler(ctx);

  } catch (err) {
    response = (await this.#hooks.onError?.(ctx, err))
      ?? ctx.respond.text('Internal Server Error', 500);
  } finally {
    await this.#hooks.onSend?.(ctx, response);
  }
  return response ?? ctx.respond.text('', 204);
}


  /**
   * Get all registered routes
   * @returns {Array} Array of registered routes
   */
  getRoutes() {
    return this.#routes.map(route => ({
      method: route.method,
      path: route.path,
      params: route.params || [],
      compiled: true
    }));
  }
}
