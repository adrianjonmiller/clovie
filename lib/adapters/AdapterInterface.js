/**
 * Clovie Adapter Interface
 * 
 * This defines the contract that all HTTP server adapters must implement.
 * The Clovie kernel uses this interface to delegate HTTP handling to
 * any compatible adapter (Express, Fastify, Node HTTP, etc.)
 */

/**
 * Adapter Interface - All adapters must implement this
 */
export class AdapterInterface {
  constructor(name) {
    this.name = name;
    this.server = null;
    this.routes = [];
    this.hooks = null;
  }

  /**
   * Initialize the adapter with routes, hooks, and useContext
   * @param {Array} routes - Array of route objects from Clovie kernel
   * @param {Object} hooks - Lifecycle hooks from Clovie kernel
   * @param {Function} useContext - Engine context accessor
   */
  async initialize(routes, hooks, useContext) {
    throw new Error(`initialize() must be implemented by ${this.name} adapter`);
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
}
