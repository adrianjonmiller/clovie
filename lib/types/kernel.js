/**
 * Server type definitions and interfaces
 */

export const Method = {
  GET: 'GET',
  POST: 'POST', 
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
};

export const Mode = {
  STATIC: 'static',
  ISR: 'isr',
  SSR: 'ssr'
};

/**
 * Response helpers for handlers
 */
export class RespondHelpers {
  constructor(context) {
    this.context = context;
  }

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

  // Legacy support for existing handlers
  send(status, body, headers = {}) {
    if (typeof status === 'string') {
      return this.text(status, 200, headers);
    }
    return this.text(body, status, headers);
  }
}

/**
 * Server context passed to route handlers
 */
export class ServerContext {
  constructor(req, state, stable, respond) {
    this.req = req;
    this.state = state;
    this.stable = stable;
    this.respond = respond;
  }
}

/**
 * Server hooks for adapter integration
 */
export class ServerHooks {
  constructor() {
    this.onRequest = null;
    this.preHandler = null;
    this.onSend = null;
    this.onError = null;
  }
}

/**
 * Server adapter interface
 */
export class ServerAdapter {

  static create(name) {
    return new this(name);
  }
  
  constructor(name) {
    this.name = name;
  }

  /**
   * Register routes and hooks with the server
   * @param {Array} routes - Array of ClovieRoute objects
   * @param {ServerHooks} hooks - Server lifecycle hooks
   */
  async register(routes, hooks) {
    throw new Error(`register() must be implemented by ${this.name} adapter`);
  }

  /**
   * Start the server listening
   * @param {Object} opts - Listen options
   * @param {number} opts.port - Port to listen on
   * @param {string} opts.host - Host to bind to (optional)
   */
  async listen(opts) {
    throw new Error(`listen() must be implemented by ${this.name} adapter`);
  }

  /**
   * Stop the server
   */
  async stop() {
    throw new Error(`stop() must be implemented by ${this.name} adapter`);
  }
}
