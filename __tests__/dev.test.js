import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { vi } from 'vitest';
import { createClovie } from '../lib/createClovie.js';

const clovie = createClovie();

describe('Dev', () => {
  it('should start the development server', () => {
    expect(clovie).toBeDefined();
  });
  
  it('should have install on install method', () => {
    expect(clovie.install).toBeDefined();
  });
  
  it('should have file installed on engine', () => {
    expect(clovie.file).toBeDefined();
    expect(clovie.file.readNames).toBeDefined();
    expect(clovie.file.write).toBeDefined();
  });
});