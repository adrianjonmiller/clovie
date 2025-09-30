import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClovie } from '../lib/createClove.js';
import fs from 'fs';
import path from 'path';

describe('Views Service', () => {
  const testDir = path.join(process.cwd(), '__tests__', 'temp-views');
  const viewsDir = path.join(testDir, 'views');
  const partialsDir = path.join(testDir, 'partials');
  const outputDir = path.join(testDir, 'output');

  beforeEach(() => {
    // Create test directories
    fs.mkdirSync(viewsDir, { recursive: true });
    fs.mkdirSync(partialsDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create test view files
    fs.writeFileSync(path.join(viewsDir, 'index.html'), '<h1>{{title}}</h1>');
    fs.writeFileSync(path.join(viewsDir, 'about.html'), '<h1>About</h1>');
    fs.writeFileSync(path.join(viewsDir, '_header.html'), '<header>Header</header>');
    
    // Create test partial files
    fs.writeFileSync(path.join(partialsDir, 'header.html'), '<header>{{title}}</header>');
    fs.writeFileSync(path.join(partialsDir, 'footer.html'), '<footer>Footer</footer>');
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should process views directory', async () => {
    const clovie = createClovie({
      views: viewsDir,
      partials: partialsDir,
      outputDir: outputDir,
      compiler: (template, data) => template.replace(/\{\{title\}\}/g, data.title || ''),
      register: () => {},
      mode: 'development'
    });

    const testData = { title: 'Test Title', content: 'Test Content' };
    const result = await clovie.views.process(viewsDir, partialsDir, testData);

    expect(result.pages).toHaveProperty('index.html');
    expect(result.pages).toHaveProperty('about.html');
    expect(result.pages).not.toHaveProperty('_header.html'); // Should skip partials
    expect(result.pages['index.html'].data).toEqual(testData);
    expect(result.partials).toHaveProperty('header');
    expect(result.partials).toHaveProperty('footer');
  });

  it('should handle missing views directory', async () => {
    const clovie = createClovie({
      views: '/non-existent',
      outputDir: outputDir,
      compiler: () => '',
      register: () => {},
      mode: 'development'
    });

    const result = await clovie.views.process('/non-existent', null, {});

    expect(result.pages).toEqual({});
    expect(result.partials).toEqual({});
  });

  it('should skip files starting with underscore', async () => {
    const clovie = createClovie({
      views: viewsDir,
      outputDir: outputDir,
      compiler: () => '',
      register: () => {},
      mode: 'development'
    });

    const result = await clovie.views.process(viewsDir, null, {});

    expect(result.pages).toHaveProperty('index.html');
    expect(result.pages).toHaveProperty('about.html');
    expect(result.pages).not.toHaveProperty('_header.html');
  });
});
