import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClovie } from '../lib/createClove.js';
import fs from 'fs';
import path from 'path';

describe('Build Service', () => {
  const testDir = path.join(process.cwd(), '__tests__', 'temp-build');
  const viewsDir = path.join(testDir, 'views');
  const outputDir = path.join(testDir, 'output');

  beforeEach(() => {
    // Create test directories
    fs.mkdirSync(viewsDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create test view files
    fs.writeFileSync(path.join(viewsDir, 'index.html'), '<h1>{{title}}</h1><p>{{content}}</p>');
    fs.writeFileSync(path.join(viewsDir, 'about.html'), '<h1>About</h1><p>{{description}}</p>');
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should build static site with data', async () => {
    const clovie = createClovie({
      views: viewsDir,
      outputDir: outputDir,
      data: {
        title: 'Welcome to Clovie',
        content: 'This is a test site',
        description: 'About our amazing site'
      },
      compiler: (template, data) => {
        return template
          .replace(/\{\{title\}\}/g, data.title || '')
          .replace(/\{\{content\}\}/g, data.content || '')
          .replace(/\{\{description\}\}/g, data.description || '');
      },
      register: () => {},
      mode: 'development'
    });

    const result = await clovie.build.static();

    expect(result.success).toBe(true);
    expect(result.filesGenerated).toBe(2);
    
    // Check that files were written
    expect(fs.existsSync(path.join(outputDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'about.html'))).toBe(true);
    
    // Check file contents
    const indexContent = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
    const aboutContent = fs.readFileSync(path.join(outputDir, 'about.html'), 'utf8');
    
    expect(indexContent).toContain('Welcome to Clovie');
    expect(indexContent).toContain('This is a test site');
    expect(aboutContent).toContain('About our amazing site');
  });

  it('should handle build without data', async () => {
    const clovie = createClovie({
      views: viewsDir,
      outputDir: outputDir,
      compiler: (template, data) => template,
      register: () => {},
      mode: 'development'
    });

    const result = await clovie.build.static();

    expect(result.success).toBe(true);
    expect(result.filesGenerated).toBe(2);
  });

  it('should handle missing views directory', async () => {
    const clovie = createClovie({
      views: '/non-existent',
      outputDir: outputDir,
      compiler: (template, data) => template,
      register: () => {},
      mode: 'development'
    });

    const result = await clovie.build.static();

    expect(result.success).toBe(true);
    expect(result.filesGenerated).toBe(0);
  });
});
