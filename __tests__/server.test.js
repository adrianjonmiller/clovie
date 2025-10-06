import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { Engine } from '@brickworks/engine';
import { Server } from '../lib/Server.js';

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
      
      expect(routes).toHaveLength(1);
      expect(routes[0].method).toBe('GET');
      expect(routes[0].path).toBe('/test');
      expect(typeof routes[0].handler).toBe('function');
    });

    it('should parse route parameters correctly', () => {
      clovie.server.add('GET', '/users/:id', () => ({}));
      const routes = clovie.server.getRoutes();
      
      expect(routes[0].params).toHaveLength(1);
      expect(routes[0].params[0].name).toBe('id');
      expect(routes[0].params[0].optional).toBe(false);
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
    });

    afterEach(async () => {
      if (server) {
        await clovie.server.stop();
        server = null;
      }
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
      server = await clovie.server.listen({ port: 0 });
    });

    afterEach(async () => {
      if (server) {
        await clovie.server.stop();
        server = null;
      }
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
      clovie.server.add('GET', '/json', (ctx) => {
        return ctx.respond.json({ message: 'Hello JSON' });
      });

      const response = await makeRequest('/json');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const data = JSON.parse(response.body);
      expect(data.message).toBe('Hello JSON');
    });

    it('should handle text responses', async () => {
      clovie.server.add('GET', '/text', (ctx) => {
        return ctx.respond.text('Hello Text');
      });

      const response = await makeRequest('/text');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.body).toBe('Hello Text');
    });

    it('should handle custom status codes', async () => {
      clovie.server.add('GET', '/created', (ctx) => {
        return ctx.respond.json({ created: true }, 201);
      });

      const response = await makeRequest('/created');
      expect(response.statusCode).toBe(201);
    });

    it('should handle custom headers', async () => {
      clovie.server.add('GET', '/headers', (ctx) => {
        return ctx.respond.json({ message: 'test' }, 200, {
          'X-Custom': 'value',
          'Cache-Control': 'no-cache'
        });
      });

      const response = await makeRequest('/headers');
      expect(response.statusCode).toBe(200);
      expect(response.headers['x-custom']).toBe('value');
      expect(response.headers['cache-control']).toBe('no-cache');
    });
  });

  describe('Hooks', () => {
    it('should execute hooks correctly', async () => {
      let hookCalls = [];
      
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
      
      // Make a request
      const response = await new Promise((resolve, reject) => {
        const port = server.address().port;
        const req = http.request({
          method: 'GET',
          path: '/hooks',
          port,
          hostname: 'localhost'
        }, (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.end();
      });

      expect(response.statusCode).toBe(200);
      expect(hookCalls).toEqual(['onRequest', 'preHandler', 'handler', 'onSend']);
      
      await clovie.server.stop();
    });
  });
});
