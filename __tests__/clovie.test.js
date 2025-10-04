import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClovie } from '../lib/createClovie.js';

const pause = async (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));

describe('ClovieConfig', () => {
  let clovie = null

  beforeEach(async () => {
    clovie = await createClovie({
      configPath: path.resolve(__dirname, 'clovie.config.js')
    });
    
    // Wait for engine initialization to complete
    await pause(50);
  });

  describe('Initialization', () => {
    it('should initialize with provided config', async () => {
      await pause();
      expect(clovie.clovieConfig.get('views')).toBe('./views');
      expect(clovie.clovieConfig.get('outputDir')).toBe('./dist');
      expect(clovie.clovieConfig.get('port')).toBe(3000);
      expect(clovie.clovieConfig.get('type')).toBe('static');
      expect(clovie.clovieConfig.get('watch')).toBe(false);
      expect(clovie.clovieConfig.get('data')).toEqual({});
    });
  });

});
