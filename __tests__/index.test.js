import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import Clovie from '../lib/main.js';
import { vi } from 'vitest';

const TEST_DIR = path.join(__dirname, '../test-output');
const TEST_CONFIG = {
  views: path.join(TEST_DIR, 'views'),
  scripts: path.join(TEST_DIR, 'scripts/main.js'),
  styles: path.join(TEST_DIR, 'styles/main.scss'),
  assets: path.join(TEST_DIR, 'assets'),
  outputDir: path.join(TEST_DIR, 'dist'),
  data: {
    title: 'Test Site'
  }
};

describe('Clovie', () => {
  beforeEach(() => {
    // Create test directory structure
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR);
      fs.mkdirSync(path.join(TEST_DIR, 'views'));
      fs.mkdirSync(path.join(TEST_DIR, 'scripts'));
      fs.mkdirSync(path.join(TEST_DIR, 'styles'));
      fs.mkdirSync(path.join(TEST_DIR, 'assets'));

      // Create a test asset file
      fs.writeFileSync(
        path.join(TEST_DIR, 'assets/test.txt'),
        'test asset'
      );
    }

    // Create test files
    fs.writeFileSync(
      path.join(TEST_DIR, 'views/index.html'),
      '<h1>{{title}}</h1>'
    );
    fs.writeFileSync(
      path.join(TEST_DIR, 'scripts/greeting.js'),
      'export const greeting = name => `Hello, ${name}!`;'
    );
    fs.writeFileSync(
      path.join(TEST_DIR, 'scripts/main.js'),
      `import { greeting } from './greeting';
       console.log(greeting('World'));`
    );
    fs.writeFileSync(
      path.join(TEST_DIR, 'styles/main.scss'),
      'body { color: black; }'
    );
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should build a site with default config', async () => {
    const site = new Clovie(TEST_CONFIG);
    await site.build();

    // Check if output directory was created
    expect(fs.existsSync(TEST_CONFIG.outputDir)).toBe(true);

    // Check if HTML was rendered with data
    const html = fs.readFileSync(path.join(TEST_CONFIG.outputDir, 'index.html'), 'utf8');
    expect(html).toContain('<h1>Test Site</h1>');

    // Check if assets were copied
    expect(fs.existsSync(path.join(TEST_CONFIG.outputDir, 'main.js'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_CONFIG.outputDir, 'main.css'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_CONFIG.outputDir, 'test.txt'))).toBe(true);
  }, 10000);

  it('should handle custom compiler', async () => {
    const customConfig = {
      ...TEST_CONFIG,
      compiler: (template, data) => `<div>${data.title}</div>`
    };

    const site = new Clovie(customConfig);
    await site.build();

    const html = fs.readFileSync(path.join(TEST_CONFIG.outputDir, 'index.html'), 'utf8');
    expect(html).toBe('<div>Test Site</div>');
  }, 10000);

  it('should handle async data', async () => {
    const asyncConfig = {
      ...TEST_CONFIG,
      data: Promise.resolve({ title: 'Async Site' })
    };

    const site = new Clovie(asyncConfig);
    await site.build();

    const html = fs.readFileSync(path.join(TEST_CONFIG.outputDir, 'index.html'), 'utf8');
    expect(html).toContain('Async Site');
  }, 10000);

  it('should handle ES6 imports', async () => {
    const site = new Clovie(TEST_CONFIG);
    await site.build();

    // Check if bundle was created
    const bundlePath = path.join(TEST_CONFIG.outputDir, 'main.js');
    expect(fs.existsSync(bundlePath)).toBe(true);

    // Read the bundle and check its contents
    const bundle = fs.readFileSync(bundlePath, 'utf8');
    expect(bundle).toContain('greeting');
    
    // Create a mock window environment
    const mockConsole = { log: vi.fn() };
    const context = {
      console: mockConsole
    };

    // Execute the bundle in the mocked context
    const fn = new Function('window', `
      globalThis.console = window.console;
      ${bundle}
    `);
    fn(context);

    // Verify the console.log was called with expected value
    expect(context.console.log).toHaveBeenCalledWith('Hello, World!');
  }, 10000);
}); 