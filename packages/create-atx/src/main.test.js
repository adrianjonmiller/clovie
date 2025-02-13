import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import create from './main';

const TEST_DIR = path.join(__dirname, '../test-output');

describe('create-atx', () => {
  beforeEach(() => {
    // Clean up test directory if it exists
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should create a new project with default template', async () => {
    await create(TEST_DIR);
    
    // Check if directory was created
    expect(fs.existsSync(TEST_DIR)).toBe(true);
    
    // Check for key files
    expect(fs.existsSync(path.join(TEST_DIR, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, 'app.config.js'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, 'scripts/main.js'))).toBe(true);
  });

  it('should fail if directory already exists', async () => {
    // Create directory
    fs.mkdirSync(TEST_DIR);

    // Attempt to create project should fail
    await expect(create(TEST_DIR)).rejects.toThrow('already exists');
  });

  it('should fail with invalid template', async () => {
    await expect(create(TEST_DIR, 'invalid-template'))
      .rejects.toThrow('Template \'invalid-template\' not found');
  });
}); 