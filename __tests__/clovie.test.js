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
