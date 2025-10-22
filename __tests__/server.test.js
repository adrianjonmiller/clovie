import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { Engine } from '@brickworks/engine';
import { Server } from '../lib/Server/Server.js';

describe('Server', () => {
  let clovie;

  beforeEach(async () => {
    clovie = Engine.create().install(Server);
  });

  afterEach(async () => {
    if (clovie.server.isRunning()) {
      await clovie.server.stop();
    }
  });

  describe('Route Management', () => {
    it('should add routes correctly', () => {
      const handler = () => ({ type: 'text', body: 'test' });
      
      clovie.server.add('GET', '/test', handler);
      const routes = clovie.server.getRoutes();
      
      // Should have default routes (health, api/info) plus our test route
      // Static route is only added if outputDir is configured
      expect(routes.length).toBeGreaterThanOrEqual(1);
      
      // Find our test route
      const testRoute = routes.find(route => route.path === '/test');
      expect(testRoute).toBeDefined();
      expect(testRoute.method).toBe('GET');
      expect(typeof testRoute.handler).toBe('function');
    });

    it('should parse route parameters correctly', () => {
      clovie.server.add('GET', '/users/:id', () => ({}));
      const routes = clovie.server.getRoutes();
      
      // Find our test route with parameters
      const userRoute = routes.find(route => route.path === '/users/:id');
      expect(userRoute).toBeDefined();
    });
  });

  describe('Server Management', () => {
    it('should start and stop server', async () => {
      clovie.server.add('GET', '/', (ctx) => ctx.respond.json({ message: 'Hello' }));
      
      // Start server
      await clovie.server.listen({ port: 0 }); // Random port
      expect(clovie.server.isRunning()).toBe(true);
      
      // Stop server
      await clovie.server.stop();
      expect(clovie.server.isRunning()).toBe(false);
    });

    it('should handle multiple start/stop cycles', async () => {
      clovie.server.add('GET', '/', (ctx) => ctx.respond.json({ message: 'Hello' }));
      
      // First cycle
      await clovie.server.listen({ port: 0 });
      expect(clovie.server.isRunning()).toBe(true);
      await clovie.server.stop();
      expect(clovie.server.isRunning()).toBe(false);
      
      // Second cycle
      await clovie.server.listen({ port: 0 });
      expect(clovie.server.isRunning()).toBe(true);
      await clovie.server.stop();
      expect(clovie.server.isRunning()).toBe(false);
    });
  });

  describe('Request/Response Handling', () => {
    let server;

    beforeEach(async () => {
      // Clear routes from previous tests
      clovie.server.clearRoutes();
      
      // Add test routes
      clovie.server.add('GET', '/test', (ctx) => {
        return ctx.respond.json({ 
          method: ctx.req.method,
          path: ctx.req.path,
          params: ctx.req.params,
          query: ctx.req.query
        });
      });

      clovie.server.add('GET', '/search', (ctx) => {
        return ctx.respond.json({ query: ctx.req.query });
      });

      clovie.server.add('GET', '/users/:id', (ctx) => {
        return ctx.respond.json({ userId: ctx.req.params.id });
      });

      // Start server on random port
      server = await clovie.server.listen({ port: 0 });
      // Small delay to ensure server is fully ready
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    afterEach(async () => {
      if (server) {
        await clovie.server.stop();
        server = null;
      }
      // Small delay to ensure port is released
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    async function makeRequest(method, path, headers = {}, body = null) {
      return new Promise((resolve, reject) => {
        const port = server.address().port;
        const options = {
          method,
          path,
          port,
          hostname: 'localhost',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data
            });
          });
        });

        req.on('error', reject);

        if (body) {
          req.write(body);
        }
        req.end();
      });
    }

    it('should handle GET requests', async () => {
      const response = await makeRequest('GET', '/test');
      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.method).toBe('GET');
      expect(data.path).toBe('/test');
    });

    it('should handle route parameters', async () => {
      const response = await makeRequest('GET', '/users/123');
      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.userId).toBe('123');
    });

    it('should handle query parameters', async () => {
      const response = await makeRequest('GET', '/search?q=test&page=1');
      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.query.q).toBe('test');
      expect(data.query.page).toBe('1');
    });

    it('should return 404 for unmatched routes', async () => {
      const response = await makeRequest('GET', '/nonexistent');
      expect(response.statusCode).toBe(404);
    });
  });

  describe('Response Helpers', () => {
    let server;

    beforeEach(async () => {
      // Clear routes from previous tests
      clovie.server.clearRoutes();
      
      // Add routes BEFORE starting server
      clovie.server.add('GET', '/json', (ctx) => {
        return ctx.respond.json({ message: 'Hello JSON' });
      });

      clovie.server.add('GET', '/text', (ctx) => {
        return ctx.respond.text('Hello Text');
      });

      clovie.server.add('GET', '/created', (ctx) => {
        return ctx.respond.json({ created: true }, 201);
      });

      clovie.server.add('GET', '/headers', (ctx) => {
        return ctx.respond.json({ message: 'test' }, 200, {
          'X-Custom': 'value',
          'Cache-Control': 'no-cache'
        });
      });

      server = await clovie.server.listen({ port: 0 });
      // Small delay to ensure server is fully ready
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    afterEach(async () => {
      if (server) {
        await clovie.server.stop();
        server = null;
      }
      // Small delay to ensure port is released
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    async function makeRequest(path) {
      return new Promise((resolve, reject) => {
        const port = server.address().port;
        const options = {
          method: 'GET',
          path,
          port,
          hostname: 'localhost'
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data
            });
          });
        });

        req.on('error', reject);
        req.end();
      });
    }

    it('should handle JSON responses', async () => {
      const response = await makeRequest('/json');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const data = JSON.parse(response.body);
      expect(data.message).toBe('Hello JSON');
    });

    it('should handle text responses', async () => {
      const response = await makeRequest('/text');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.body).toBe('Hello Text');
    });

    it('should handle custom status codes', async () => {
      const response = await makeRequest('/created');
      expect(response.statusCode).toBe(201);
    });

    it('should handle custom headers', async () => {
      const response = await makeRequest('/headers');
      expect(response.statusCode).toBe(200);
      expect(response.headers['x-custom']).toBe('value');
      expect(response.headers['cache-control']).toBe('no-cache');
    });
  });

  describe('Hooks', () => {
    it('should execute hooks correctly', async () => {
      let hookCalls = [];
      
      // Clear routes from previous tests
      clovie.server.clearRoutes();
      
      clovie.server.hooks({
        onRequest: async (ctx) => {
          hookCalls.push('onRequest');
        },
        preHandler: async (ctx) => {
          hookCalls.push('preHandler');
        },
        onSend: async (ctx, response) => {
          hookCalls.push('onSend');
        }
      });

      clovie.server.add('GET', '/hooks', (ctx) => {
        hookCalls.push('handler');
        return ctx.respond.json({ message: 'test' });
      });

      const server = await clovie.server.listen({ port: 0 });
      
      // Make a request and wait for full response
      const response = await new Promise((resolve, reject) => {
        const port = server.address().port;
        const req = http.request({
          method: 'GET',
          path: '/hooks',
          port,
          hostname: 'localhost'
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, body: data });
          });
        });
        req.on('error', reject);
        req.end();
      });

      expect(response.statusCode).toBe(200);
      expect(hookCalls).toEqual(['onRequest', 'preHandler', 'handler', 'onSend']);
      
      await clovie.server.stop();
    });
  });

  describe('Middleware', () => {
    it('should execute middleware and add custom header', async () => {
      // Create a new server instance
      const middlewareClovie = Engine.create().install(Server);
      
      // Set up middleware by directly configuring the adapter
      const { ExpressAdapter } = await import('../lib/Server/adapters/ExpressAdapter.js');
      const adapter = ExpressAdapter.create();
      middlewareClovie.server.useAdapter(adapter);
      
      middlewareClovie.server.add('GET', '/middleware-test', (ctx) => {
        return ctx.respond.json({ message: 'success' });
      });

      // Start server with middleware configuration
      const server = await middlewareClovie.server.listen({ 
        port: 0,
        adapter: 'express',
        middleware: [
          (req, res, next) => {
            res.setHeader('X-Middleware-Test', 'working');
            next();
          }
        ]
      });

      // Make request
      const response = await new Promise((resolve, reject) => {
        const port = server.address().port;
        const req = http.request({
          method: 'GET',
          path: '/middleware-test',
          port,
          hostname: 'localhost'
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data
            });
          });
        });
        req.on('error', reject);
        req.end();
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-middleware-test']).toBe('working');
      
      const data = JSON.parse(response.body);
      expect(data.message).toBe('success');
      
      await middlewareClovie.server.stop();
    });

    it('should execute multiple middleware in correct order', async () => {
      const middlewareClovie = Engine.create().install(Server);
      
      // Set up middleware chain
      const { ExpressAdapter } = await import('../lib/Server/adapters/ExpressAdapter.js');
      const adapter = ExpressAdapter.create();
      middlewareClovie.server.useAdapter(adapter);
      
      middlewareClovie.server.add('GET', '/order-test', (ctx) => {
        return ctx.respond.json({ message: 'handler executed' });
      });

      const server = await middlewareClovie.server.listen({ 
        port: 0,
        adapter: 'express',
        middleware: [
          (req, res, next) => {
            res.setHeader('X-Order', '1');
            next();
          },
          (req, res, next) => {
            const current = res.getHeader('X-Order') || '';
            res.setHeader('X-Order', current + ',2');
            next();
          },
          (req, res, next) => {
            const current = res.getHeader('X-Order') || '';
            res.setHeader('X-Order', current + ',3');
            next();
          }
        ]
      });

      const response = await new Promise((resolve, reject) => {
        const port = server.address().port;
        const req = http.request({
          method: 'GET',
          path: '/order-test',
          port,
          hostname: 'localhost'
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data
            });
          });
        });
        req.on('error', reject);
        req.end();
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-order']).toBe('1,2,3');
      
      const data = JSON.parse(response.body);
      expect(data.message).toBe('handler executed');
      
      await middlewareClovie.server.stop();
    });

    it('should handle auth middleware that blocks requests', async () => {
      const middlewareClovie = Engine.create().install(Server);
      
      const { ExpressAdapter } = await import('../lib/Server/adapters/ExpressAdapter.js');
      const adapter = ExpressAdapter.create();
      middlewareClovie.server.useAdapter(adapter);
      
      middlewareClovie.server.add('GET', '/protected', (ctx) => {
        return ctx.respond.json({ secret: 'protected data' });
      });

      middlewareClovie.server.add('GET', '/public', (ctx) => {
        return ctx.respond.json({ message: 'public data' });
      });

      const server = await middlewareClovie.server.listen({ 
        port: 0,
        adapter: 'express',
        middleware: [
          (req, res, next) => {
            if (req.url.startsWith('/protected')) {
              const auth = req.headers.authorization;
              if (!auth || !auth.startsWith('Bearer ')) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return; // Don't call next()
              }
            }
            next();
          }
        ]
      });

      // Test 1: Unauthorized request should be blocked
      const unauthorizedResponse = await new Promise((resolve, reject) => {
        const port = server.address().port;
        const req = http.request({
          method: 'GET',
          path: '/protected',
          port,
          hostname: 'localhost'
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              body: data
            });
          });
        });
        req.on('error', reject);
        req.end();
      });

      expect(unauthorizedResponse.statusCode).toBe(401);
      const unauthorizedData = JSON.parse(unauthorizedResponse.body);
      expect(unauthorizedData.error).toBe('Unauthorized');

      // Test 2: Authorized request should succeed
      const authorizedResponse = await new Promise((resolve, reject) => {
        const port = server.address().port;
        const req = http.request({
          method: 'GET',
          path: '/protected',
          port,
          hostname: 'localhost',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              body: data
            });
          });
        });
        req.on('error', reject);
        req.end();
      });

      expect(authorizedResponse.statusCode).toBe(200);
      const authorizedData = JSON.parse(authorizedResponse.body);
      expect(authorizedData.secret).toBe('protected data');

      // Test 3: Public endpoint should always work
      const publicResponse = await new Promise((resolve, reject) => {
        const port = server.address().port;
        const req = http.request({
          method: 'GET',
          path: '/public',
          port,
          hostname: 'localhost'
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              body: data
            });
          });
        });
        req.on('error', reject);
        req.end();
      });

      expect(publicResponse.statusCode).toBe(200);
      const publicData = JSON.parse(publicResponse.body);
      expect(publicData.message).toBe('public data');
      
      await middlewareClovie.server.stop();
    });

    it('should validate middleware configuration', async () => {
      const middlewareClovie = Engine.create().install(Server);
      
      const { ExpressAdapter } = await import('../lib/Server/adapters/ExpressAdapter.js');
      const adapter = ExpressAdapter.create();
      middlewareClovie.server.useAdapter(adapter);

      // Test 1: Non-array middleware should be rejected
      await expect(async () => {
        await middlewareClovie.server.listen({ 
          port: 0,
          adapter: 'express',
          middleware: "not an array" // Invalid
        });
      }).rejects.toThrow('opts.middleware must be an array');

      // Test 2: Non-function items in middleware array should be rejected  
      await expect(async () => {
        await middlewareClovie.server.listen({ 
          port: 0,
          adapter: 'express',
          middleware: [
            (req, res, next) => next(), // Valid function
            "not a function", // Invalid
            (req, res, next) => next()  // Valid function
          ]
        });
      }).rejects.toThrow('Failed to apply middleware[1]');
    });
  });
});
