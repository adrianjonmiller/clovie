import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createClovie } from '../lib/createClovie.js';
import { vi } from 'vitest';

const TEST_DIR = path.join(process.cwd(), 'test-output');
const TEST_CONFIG = {
  views: path.join(TEST_DIR, 'views'),
  scripts: path.join(TEST_DIR, 'scripts'),
  styles: path.join(TEST_DIR, 'styles'),
  assets: path.join(TEST_DIR, 'assets'),
  partials: path.join(TEST_DIR, 'partials'),
  outputDir: path.join(TEST_DIR, 'dist'),
  data: {
    title: 'Test Site'
  },
  compiler: (template, data) => {
    // Simple template compilation for testing
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  },
  register: (name, template) => {
    // Mock Handlebars registration for testing
    if (!global.testPartials) global.testPartials = {};
    global.testPartials[name] = template;
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
      fs.mkdirSync(path.join(TEST_DIR, 'partials'));

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

    // Create test partials
    fs.writeFileSync(
      path.join(TEST_DIR, 'partials/header.html'),
      '<header><h1>{{title}}</h1></header>'
    );
    fs.writeFileSync(
      path.join(TEST_DIR, 'partials/footer.html'),
      '<footer><p>&copy; 2024 Test Site</p></footer>'
    );
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should build a site with default config', async () => {
    const site = await createClovie(TEST_CONFIG);
    await site.build.static();

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

    const site = await createClovie(customConfig);
    await site.build.static();

    const html = fs.readFileSync(path.join(TEST_CONFIG.outputDir, 'index.html'), 'utf8');
    expect(html).toBe('<div>Test Site</div>');
  }, 10000);

  it('should handle async data', async () => {
    const asyncConfig = {
      ...TEST_CONFIG,
      data: Promise.resolve({ title: 'Async Site' })
    };

    const site = await createClovie(asyncConfig);
    await site.build.static();

    const html = fs.readFileSync(path.join(TEST_CONFIG.outputDir, 'index.html'), 'utf8');
    expect(html).toContain('Async Site');
  }, 10000);

  it('should handle ES6 imports', async () => {
    const site = await createClovie(TEST_CONFIG);
    await site.build.static();

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

  it('should load and register partials', async () => {
    // Clear any existing test partials
    global.testPartials = {};
    
    const site = await createClovie(TEST_CONFIG);
    await site.build.static();

    // Check if partials were registered
    expect(global.testPartials).toHaveProperty('header');
    expect(global.testPartials).toHaveProperty('footer');
    expect(global.testPartials.header).toBe('<header><h1>{{title}}</h1></header>');
    expect(global.testPartials.footer).toBe('<footer><p>&copy; 2024 Test Site</p></footer>');
  }, 10000);

  it('should handle partials with custom register function', async () => {
    // Clear any existing test partials
    global.testPartials = {};
    
    const customPartialsConfig = {
      ...TEST_CONFIG,
      register: (name, template) => {
        // Custom register function that adds a prefix
        if (!global.testPartials) global.testPartials = {};
        global.testPartials[`custom_${name}`] = `<!-- Custom: ${template} -->`;
      }
    };

    const site = await createClovie(customPartialsConfig);
    await site.build.static();

    // Check if partials were registered with custom register function
    expect(global.testPartials).toHaveProperty('custom_header');
    expect(global.testPartials).toHaveProperty('custom_footer');
    expect(global.testPartials.custom_header).toBe('<!-- Custom: <header><h1>{{title}}</h1></header> -->');
    expect(global.testPartials.custom_footer).toBe('<!-- Custom: <footer><p>&copy; 2024 Test Site</p></footer> -->');
  }, 10000);

  it('should handle missing partials directory gracefully', async () => {
    // Clear any existing test partials
    global.testPartials = {};
    
    // Mock console methods to prevent test failures
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = vi.fn();
    console.error = vi.fn();
    
    try {
      const configWithoutPartials = {
        ...TEST_CONFIG,
        partials: path.join(TEST_DIR, 'nonexistent-partials'),
        register: (name, template) => {
          if (!global.testPartials) global.testPartials = {};
          global.testPartials[name] = template;
        }
      };

      const site = await createClovie(configWithoutPartials);
      
      // Should not throw an error
      await expect(site.build.static()).resolves.not.toThrow();
      
      // Should not register any partials
      expect(global.testPartials || {}).toEqual({});
    } finally {
      // Restore original console methods
      console.warn = originalWarn;
      console.error = originalError;
    }
  }, 10000);
}); 