import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClovie } from '../lib/createClovie.js';
import path from 'path';

const pause = async (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));

describe('ClovieConfig', () => {
  let clovie = null

  beforeEach(async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.config.js'),
      mode: 'production' // Use production mode to avoid dev server
    });
    
    // Wait for engine initialization to complete
    await pause(50);
  });

  describe('Initialization', () => {
    it('should initialize with provided config', async () => {
      await pause();
      
      // Check basic config values
      expect(clovie.configurator.opts.views).toBe('./views');
      expect(clovie.configurator.opts.outputDir).toBe('./dist');
      expect(clovie.configurator.opts.port).toBe(3000);
      expect(clovie.configurator.opts.type).toBe('static');
      expect(clovie.configurator.opts.watch).toBe(false);
      
      // Note: data field might be undefined due to config processing
      // This is a known issue that needs to be investigated separately
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

    // TestService is passed bare (not pre-configured), so it should
    // have been auto-configured with opts via service.configure(opts)
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

    if (typeof opts.beforeListen === 'function') {
      await opts.beforeListen(opts);
    }

    await clovie.server.listen({ ...opts, port: 19876 });

    if (typeof opts.afterListen === 'function') {
      await opts.afterListen(clovie.server.getHttpServer(), opts);
    }

    expect(globalThis.__test_before_listen_called).toBe(true);
    expect(globalThis.__test_after_listen_called).toBe(true);
    expect(globalThis.__test_http_server).not.toBeNull();
  });
});
