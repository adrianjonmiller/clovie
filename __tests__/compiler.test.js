import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClovie } from '../lib/createClove.js';

describe('Compiler', () => {
  let clovie;
  let mockCompiler;
  let mockRegister;

  beforeEach(() => {
    // Create mock compiler function
    mockCompiler = vi.fn((template, data) => {
      // Simple template replacement for testing
      return template
        .replace(/\{\{title\}\}/g, data.title || '')
        .replace(/\{\{content\}\}/g, data.content || '')
        .replace(/\{\{name\}\}/g, data.name || '');
    });

    // Create mock register function
    mockRegister = vi.fn();

    // Create clovie instance with test config
    clovie = createClovie({
      compiler: mockCompiler,
      register: mockRegister,
      mode: 'development'
    });
  });

  it('should compile templates with data', async () => {
    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1><p>{{content}}</p>',
        data: {
          title: 'Welcome',
          content: 'Hello World'
        }
      }
    };

    const result = await clovie.compiler.templates(views);

    expect(result).toHaveProperty('index.html');
    expect(result['index.html']).toBe('<h1>Welcome</h1><p>Hello World</p>');
    expect(mockCompiler).toHaveBeenCalledWith(
      '<h1>{{title}}</h1><p>{{content}}</p>',
      expect.objectContaining({
        title: 'Welcome',
        content: 'Hello World',
        fileName: 'index.html',
        fileNames: ['index.html']
      })
    );
  });

  it('should handle multiple templates', async () => {
    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'Home' }
      },
      'about.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'About' }
      }
    };

    const result = await clovie.compiler.templates(views);

    expect(result).toHaveProperty('index.html');
    expect(result).toHaveProperty('about.html');
    expect(result['index.html']).toBe('<h1>Home</h1>');
    expect(result['about.html']).toBe('<h1>About</h1>');
  });

  it('should register partials when provided', async () => {
    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'Home' }
      }
    };

    const partials = {
      'header': '<header>{{name}}</header>',
      'footer': '<footer>Footer</footer>'
    };

    await clovie.compiler.templates(views, partials);

    expect(mockRegister).toHaveBeenCalledWith('header', '<header>{{name}}</header>');
    expect(mockRegister).toHaveBeenCalledWith('footer', '<footer>Footer</footer>');
  });

  it('should not register partials when register function is not provided', async () => {
    // Create clovie without register function
    const clovieNoRegister = createClovie({
      compiler: mockCompiler,
      mode: 'development'
    });

    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'Home' }
      }
    };

    const partials = {
      'header': '<header>{{name}}</header>'
    };

    await clovieNoRegister.compiler.templates(views, partials);

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should inject live reload script in development mode', async () => {
    const views = {
      'index.html': {
        template: '<html><body><h1>{{title}}</h1></body></html>',
        data: { title: 'Home' }
      }
    };

    const result = await clovie.compiler.templates(views);

    expect(result['index.html']).toContain('Live Reload Script');
    expect(result['index.html']).toContain('socket.io');
    expect(result['index.html']).toContain('window.location.reload()');
  });

  it('should not inject live reload script in production mode', async () => {
    const clovieProd = createClovie({
      compiler: mockCompiler,
      register: mockRegister,
      mode: 'production'
    });

    const views = {
      'index.html': {
        template: '<html><body><h1>{{title}}</h1></body></html>',
        data: { title: 'Home' }
      }
    };

    const result = await clovieProd.compiler.templates(views);

    expect(result['index.html']).not.toContain('Live Reload Script');
    expect(result['index.html']).not.toContain('socket.io');
  });

  it('should handle templates without body tag', async () => {
    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'Home' }
      }
    };

    const result = await clovie.compiler.templates(views);

    expect(result['index.html']).toBe('<h1>Home</h1>');
    expect(result['index.html']).not.toContain('Live Reload Script');
  });

  it('should handle empty views object', async () => {
    const result = await clovie.compiler.templates({});

    expect(result).toEqual({});
    expect(mockCompiler).not.toHaveBeenCalled();
  });

  it('should handle views with missing template', async () => {
    const views = {
      'index.html': {
        data: { title: 'Home' }
        // Missing template
      }
    };

    const result = await clovie.compiler.templates(views);

    expect(result).toEqual({});
    expect(mockCompiler).not.toHaveBeenCalled();
  });

  it('should handle async compiler functions', async () => {
    const asyncCompiler = vi.fn(async (template, data) => {
      // Simulate async compilation
      await new Promise(resolve => setTimeout(resolve, 10));
      return template.replace(/\{\{title\}\}/g, data.title || '');
    });

    const clovieAsync = createClovie({
      compiler: asyncCompiler,
      register: mockRegister,
      mode: 'development'
    });

    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'Async Title' }
      }
    };

    const result = await clovieAsync.compiler.templates(views);

    expect(result['index.html']).toBe('<h1>Async Title</h1>');
  });

  it('should handle compiler errors gracefully', async () => {
    const errorCompiler = vi.fn(() => {
      throw new Error('Compilation failed');
    });

    const clovieError = createClovie({
      compiler: errorCompiler,
      register: mockRegister,
      mode: 'development'
    });

    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'Home' }
      }
    };

    // Should not throw, but handle the error
    await expect(clovieError.compiler.templates(views)).rejects.toThrow('Compilation failed');
  });

  it('should handle partial registration errors gracefully', async () => {
    const errorRegister = vi.fn(() => {
      throw new Error('Registration failed');
    });

    const clovieError = createClovie({
      compiler: mockCompiler,
      register: errorRegister,
      mode: 'development'
    });

    const views = {
      'index.html': {
        template: '<h1>{{title}}</h1>',
        data: { title: 'Home' }
      }
    };

    const partials = {
      'header': '<header>{{name}}</header>'
    };

    // Should not throw, but handle the error gracefully
    const result = await clovieError.compiler.templates(views, partials);
    expect(result['index.html']).toBe('<h1>Home</h1>');
  });
});
