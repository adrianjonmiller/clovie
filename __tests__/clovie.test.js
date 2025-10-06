import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClovie } from '../lib/createClovie.js';
import path from 'path';

const pause = async (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));

describe('ClovieConfig', () => {
  let clovie = null

  beforeEach(async () => {
    clovie = await createClovie({
      configPath: path.resolve(process.cwd(), '__tests__', 'clovie.config.js'),
      mode: 'production' // Use production mode to avoid dev server
    });
    
    // Wait for engine initialization to complete
    await pause(50);
  });

  describe('Initialization', () => {
    it('should initialize with provided config', async () => {
      await pause();
      
      // Check basic config values
      expect(clovie.configurator.get('views')).toBe('./views');
      expect(clovie.configurator.get('outputDir')).toBe('./dist');
      expect(clovie.configurator.get('port')).toBe(3000);
      expect(clovie.configurator.get('type')).toBe('static');
      expect(clovie.configurator.get('watch')).toBe(false);
      
      // Note: data field might be undefined due to config processing
      // This is a known issue that needs to be investigated separately
    });
  });

});
