import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClovie } from '../lib/createClovie.js';
import { transformConfig } from '../lib/utils/transformConfig.js';
import { normalizeToFactories } from '../lib/utils/normalizeToFactories.js';
import { resolveRoutes } from '../lib/utils/viewsToRoutes.js';
import { defineRoutes as defineServerRoutes } from '@jucie.io/engine-server';
import { defineHooks } from '../lib/factories/hooks.js';
import { defineMiddleware } from '../lib/factories/middleware.js';
import path from 'path';

const pause = async (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));

describe('ClovieConfig', () => {
  let clovie = null

  beforeEach(async () => {
    clovie = await createClovie({
      open: false,
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.config.js'),
      mode: 'production'
    });
    
    await pause(50);
  });

  describe('Initialization', () => {
    it('should initialize with provided config', async () => {
      await pause();
      
      expect(clovie.configurator.opts.views).toBe('./views');
      expect(clovie.configurator.opts.outputDir).toBe('./dist');
      expect(clovie.configurator.opts.port).toBe(3000);
      expect(clovie.configurator.opts.type).toBe('static');
      expect(clovie.configurator.opts.watch).toBe(false);
    });
  });

});

describe('Extensibility Hooks', () => {
  let clovie = null;

  beforeEach(() => {
    globalThis.__test_setup_called = false;
    globalThis.__test_setup_engine = null;
    globalThis.__test_before_listen_called = false;
    globalThis.__test_after_listen_called = false;
    globalThis.__test_http_server = null;
  });

  afterEach(async () => {
    if (clovie?.server?.isRunning()) {
      await clovie.server.stop();
    }
    clovie = null;
  });

  it('should install services from services array', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.extensibility.config.js'),
    });
    await pause(50);

    expect(clovie.testService).toBeDefined();
    expect(clovie.testService.ping()).toBe('pong');
  });

  it('should auto-configure bare services with opts', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.extensibility.config.js'),
    });
    await pause(50);

    expect(clovie.testService).toBeDefined();
  });

  it('should call setup(engine) hook during creation', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.extensibility.config.js'),
    });
    await pause(50);

    expect(globalThis.__test_setup_called).toBe(true);
    expect(globalThis.__test_setup_engine).toBe(clovie);
  });

  it('should call beforeListen and afterListen during serve', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.extensibility.config.js'),
    });
    await pause(50);

    const opts = clovie.configurator.opts;
    const useContext = () => {};

    if (typeof opts.beforeListen === 'function') {
      await opts.beforeListen(useContext, opts);
    }

    await clovie.server.listen({ ...opts, port: 19876, open: false });

    if (typeof opts.afterListen === 'function') {
      await opts.afterListen(useContext, opts, clovie.server.getHttpServer());
    }

    expect(globalThis.__test_before_listen_called).toBe(true);
    expect(globalThis.__test_after_listen_called).toBe(true);
    expect(globalThis.__test_http_server).not.toBeNull();
  });
});

describe('Factory Resolution', () => {
  let clovie = null;

  beforeEach(() => {
    globalThis.__test_hooks_factory_called = false;
    globalThis.__test_hook_on_request_fired = false;
  });

  afterEach(async () => {
    if (clovie?.server?.isRunning()) {
      await clovie.server.stop();
    }
    clovie = null;
    delete globalThis.__test_hooks_factory_called;
    delete globalThis.__test_hook_on_request_fired;
  });

  it('should resolve a mixed api array with raw objects and factories', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.factories.config.js'),
    });
    await pause(50);

    const opts = clovie.configurator.opts;

    // Verify defineApi factories were resolved into plain route objects
    expect(Array.isArray(opts.api)).toBe(true);
    expect(opts.api.length).toBe(3);
    expect(opts.api.every(r => typeof r === 'object' && typeof r.handler === 'function')).toBe(true);

    // Verify factory name was prepended to paths
    const paths = opts.api.map(r => r.path);
    expect(paths).toContain('/api/raw');
    expect(paths).toContain('/api/from-factory');
    expect(paths).toContain('/api/from-extra-factory');

    // Verify they work when registered with the server
    const factories = normalizeToFactories(opts.api, defineServerRoutes);
    clovie.server.use(...factories);
    await clovie.server.listen({ ...opts, port: 0, open: false });

    const address = clovie.server.getHttpServer().address();
    const base = `http://localhost:${address.port}`;

    const rawRes = await fetch(`${base}/api/raw`);
    expect(rawRes.ok).toBe(true);
    expect((await rawRes.json()).source).toBe('raw');

    const factoryRes = await fetch(`${base}/api/from-factory`);
    expect(factoryRes.ok).toBe(true);
    expect((await factoryRes.json()).source).toBe('factory');

    const extraRes = await fetch(`${base}/api/from-extra-factory`);
    expect(extraRes.ok).toBe(true);
    expect((await extraRes.json()).source).toBe('extra-factory');
  });

  it('should resolve a single factory as opts.api', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.factories.config.js'),
    });
    await pause(50);

    const opts = clovie.configurator.opts;

    // Verify all api entries are resolved plain objects (none are functions)
    expect(opts.api.every(r => typeof r !== 'function')).toBe(true);

    // Register additional plain routes alongside resolved opts
    const singleRoutes = [
      { method: 'GET', path: '/api/single', handler: (ctx) => ctx.respond.json({ source: 'single' }) },
    ];

    const factories = normalizeToFactories([...opts.api, ...singleRoutes], defineServerRoutes);
    clovie.server.use(...factories);
    await clovie.server.listen({ ...opts, port: 0, open: false });

    const address = clovie.server.getHttpServer().address();
    const res = await fetch(`http://localhost:${address.port}/api/single`);
    expect(res.ok).toBe(true);
    expect((await res.json()).source).toBe('single');
  });

  it('should resolve hooks from a factory', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.factories.config.js'),
    });
    await pause(50);

    const opts = clovie.configurator.opts;
    const hookFactories = normalizeToFactories(opts.hooks, defineHooks);
    const apiFactories = normalizeToFactories(opts.api, defineServerRoutes);
    clovie.server.use(...hookFactories, ...apiFactories);
    await clovie.server.listen({ ...opts, port: 0, open: false });

    expect(globalThis.__test_hooks_factory_called).toBe(true);

    const address = clovie.server.getHttpServer().address();
    await fetch(`http://localhost:${address.port}/api/raw`);

    expect(globalThis.__test_hook_on_request_fired).toBe(true);
  });

  it('should handle raw hooks object without factory', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.factories.config.js'),
    });
    await pause(50);

    const opts = clovie.configurator.opts;
    globalThis.__test_raw_hook_called = false;

    const hookFactories = normalizeToFactories({
      onRequest: () => { globalThis.__test_raw_hook_called = true; },
    }, defineHooks);
    const apiFactories = normalizeToFactories(opts.api, defineServerRoutes);
    clovie.server.use(...hookFactories, ...apiFactories);
    await clovie.server.listen({ ...opts, port: 0, open: false });

    const address = clovie.server.getHttpServer().address();
    await fetch(`http://localhost:${address.port}/api/raw`);

    expect(globalThis.__test_raw_hook_called).toBe(true);
    delete globalThis.__test_raw_hook_called;
  });
});

describe('normalizeToFactories', () => {
  it('should return empty array for null/undefined', () => {
    expect(normalizeToFactories(null, defineServerRoutes)).toEqual([]);
    expect(normalizeToFactories(undefined, defineServerRoutes)).toEqual([]);
  });

  it('should wrap a raw object with the factory function', () => {
    const raw = { onRequest: () => {} };
    const result = normalizeToFactories(raw, defineHooks);
    expect(result).toHaveLength(1);
  });

  it('should wrap a raw array with the factory function', () => {
    const rawRoutes = [
      { method: 'GET', path: '/a', handler: () => {} },
      { method: 'GET', path: '/b', handler: () => {} },
    ];
    const result = normalizeToFactories(rawRoutes, defineServerRoutes);
    expect(result).toHaveLength(1);
  });

  it('should pass through a single factory as-is', () => {
    const factory = defineServerRoutes('test', () => [
      { method: 'GET', path: '/a', handler: () => {} },
    ]);
    const result = normalizeToFactories(factory, defineServerRoutes);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(factory);
  });

  it('should handle intermixed raw items and factories', () => {
    const factory = defineServerRoutes('test', () => [
      { method: 'GET', path: '/b', handler: () => {} },
    ]);
    const mixed = [
      { method: 'GET', path: '/a', handler: () => {} },
      factory,
      { method: 'GET', path: '/c', handler: () => {} },
    ];
    const result = normalizeToFactories(mixed, defineServerRoutes);
    expect(result).toHaveLength(3);
    expect(result[1]).toBe(factory);
  });
});

describe('resolveRoutes', () => {
  it('should return empty array for null/undefined', () => {
    expect(resolveRoutes(null)).toEqual([]);
    expect(resolveRoutes(undefined)).toEqual([]);
  });

  it('should pass through plain route configs as-is', () => {
    const routes = [
      { path: '/a', template: 'a.html', data: () => ({}) },
      { path: '/b', template: 'b.html', data: () => ({}) },
    ];
    const result = resolveRoutes(routes);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(routes[0]);
    expect(result[1]).toBe(routes[1]);
  });

  it('should call functions and flatten their return values', () => {
    const routes = [
      () => [
        { path: '/a', template: 'a.html' },
        { path: '/b', template: 'b.html' },
      ],
    ];
    const result = resolveRoutes(routes);
    expect(result).toHaveLength(2);
    expect(result[0].path).toBe('/a');
    expect(result[1].path).toBe('/b');
  });

  it('should handle a function returning a single object', () => {
    const routes = [
      () => ({ path: '/single', template: 'single.html' }),
    ];
    const result = resolveRoutes(routes);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/single');
  });

  it('should handle intermixed plain configs and functions', () => {
    const routes = [
      { path: '/raw-a', template: 'a.html' },
      () => [{ path: '/fn-b', template: 'b.html' }],
      { path: '/raw-c', template: 'c.html' },
    ];
    const result = resolveRoutes(routes);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.path)).toEqual(['/raw-a', '/fn-b', '/raw-c']);
  });

  it('should pass useContext to route functions', () => {
    let receivedContext = null;
    const mockUseContext = (name) => ({ name });
    const routes = [
      (useContext) => {
        receivedContext = useContext;
        return [{ path: '/ctx', template: 'ctx.html' }];
      },
    ];
    const result = resolveRoutes(routes, mockUseContext);
    expect(receivedContext).toBe(mockUseContext);
    expect(receivedContext('server')).toEqual({ name: 'server' });
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/ctx');
  });
});

describe('Route Factory Integration', () => {
  let clovie = null;

  afterEach(async () => {
    if (clovie?.server?.isRunning()) {
      await clovie.server.stop();
    }
    clovie = null;
  });

  it('should serve intermixed raw routes and function routes', async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.routes-factories.config.js'),
    });
    await pause(50);

    const opts = clovie.configurator.opts;
    const services = { file: clovie.file, liveReload: clovie.liveReload };

    const { pagesToRoutes } = await import('../lib/utils/viewsToRoutes.js');
    const pageRoutes = pagesToRoutes(resolveRoutes(opts.routes), opts, services);
    const routeFactories = normalizeToFactories(pageRoutes, defineServerRoutes);
    clovie.server.use(...routeFactories);
    await clovie.server.listen({ ...opts, port: 0, open: false });

    const address = clovie.server.getHttpServer().address();
    const base = `http://localhost:${address.port}`;

    const templateRes = await fetch(`${base}/test-page`);
    expect(templateRes.ok).toBe(true);
    const html = await templateRes.text();
    expect(html).toContain('Test Page');

    const factoryRes = await fetch(`${base}/from-factory`);
    expect(factoryRes.ok).toBe(true);
    const factoryHtml = await factoryRes.text();
    expect(factoryHtml).toContain('Factory Page');

    const anotherRes = await fetch(`${base}/another-page`);
    expect(anotherRes.ok).toBe(true);
    const anotherHtml = await anotherRes.text();
    expect(anotherHtml).toContain('Another Page');
  });
});

describe('Middleware', () => {
  describe('transformConfig passthrough', () => {
    it('should preserve middleware array in config without validation', async () => {
      const config = await transformConfig({
        middleware: [(req, res, next) => next()],
      });
      expect(config.middleware).toHaveLength(1);
    });

    it('should not set adapter (engine-server handles adapter selection)', async () => {
      const config = await transformConfig({
        middleware: [(req, res, next) => next()],
      });
      expect(config.adapter).toBeUndefined();
    });

    it('should pass through non-array middleware without error', async () => {
      const config = await transformConfig({
        middleware: 'not-an-array',
      });
      expect(config.middleware).toBe('not-an-array');
    });
  });

  describe('config propagation', () => {
    let clovie = null;

    afterEach(async () => {
      if (clovie?.server?.isRunning()) {
        await clovie.server.stop();
      }
      clovie = null;
    });

    it('should preserve middleware array in opts', async () => {
      clovie = await createClovie({
        optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.middleware.config.js'),
      });
      await pause(50);

      const opts = clovie.configurator.opts;
      expect(opts.middleware).toBeDefined();
      expect(Array.isArray(opts.middleware)).toBe(true);
      expect(opts.middleware).toHaveLength(2);
    });
  });

  describe('execution', () => {
    let clovie = null;

    beforeEach(() => {
      globalThis.__test_middleware_order = [];
    });

    afterEach(async () => {
      if (clovie?.server?.isRunning()) {
        await clovie.server.stop();
      }
      clovie = null;
      delete globalThis.__test_middleware_order;
    });

    it('should execute middleware on incoming requests', async () => {
      clovie = await createClovie({
        optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.middleware.config.js'),
      });
      await pause(50);

      const opts = clovie.configurator.opts;
      const apiFactories = normalizeToFactories(opts.api, defineServerRoutes);
      clovie.server.use(...apiFactories);
      await clovie.server.listen({ ...opts, port: 0 });

      const address = clovie.server.getHttpServer().address();
      const res = await fetch(`http://localhost:${address.port}/api/ping`);

      expect(res.headers.get('x-middleware-first')).toBe('applied');
      expect(res.headers.get('x-middleware-second')).toBe('applied');
    });

    it('should execute middleware in registration order', async () => {
      clovie = await createClovie({
        optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.middleware.config.js'),
      });
      await pause(50);

      const opts = clovie.configurator.opts;
      const apiFactories = normalizeToFactories(opts.api, defineServerRoutes);
      clovie.server.use(...apiFactories);
      await clovie.server.listen({ ...opts, port: 0 });

      const address = clovie.server.getHttpServer().address();
      await fetch(`http://localhost:${address.port}/api/ping`);

      expect(globalThis.__test_middleware_order).toEqual(['first', 'second']);
    });

    it('should execute middleware normalized through defineMiddleware factory', async () => {
      clovie = await createClovie({
        optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.middleware.config.js'),
      });
      await pause(50);

      const opts = clovie.configurator.opts;
      const mwFactories = normalizeToFactories(opts.middleware, defineMiddleware);
      const apiFactories = normalizeToFactories(opts.api, defineServerRoutes);
      clovie.server.use(...mwFactories, ...apiFactories);
      await clovie.server.listen({ ...opts, middleware: undefined, port: 0 });

      const address = clovie.server.getHttpServer().address();
      const res = await fetch(`http://localhost:${address.port}/api/ping`);

      expect(res.headers.get('x-middleware-first')).toBe('applied');
      expect(res.headers.get('x-middleware-second')).toBe('applied');
      expect(globalThis.__test_middleware_order).toEqual(['first', 'second']);
    });
  });
});
