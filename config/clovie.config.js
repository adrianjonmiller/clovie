import Handlebars from 'handlebars';
import path from 'path';

export default {
  // Mode: 'static' for static site generation, 'live' for dynamic server
  mode: 'static',
  
  // Smart defaults - these paths are automatically detected
  scripts: null,        // Will auto-detect if not specified
  styles: null,         // Will auto-detect if not specified
  assets: null,         // Will auto-detect if not specified
  views: null,
  partials: null,
  outputDir: path.resolve('./dist/'),
  
  // Server configuration (for live mode)
  server: {
    port: 3000,
    host: 'localhost',
    open: false
  },
  
  // Routes configuration
  routes: [],
  
  // API routes configuration
  api: [],
  
  // Global middleware (for live mode)
  middleware: [],
  
  // Global hooks
  before: null,   // Global before hook
  after: null,    // Global after hook
  
  // Data and models
  data: {},
  models: {},
  
  register: (name, template) => {
    Handlebars.registerPartial(name, template);
  },

  compiler: (template, data) => {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (err) {
      console.warn(`⚠️  Template compilation error: ${err.message}`);
      return template; // Fallback to raw template
    }
  },
  
  // Development options
  watch: false,
  port: 3000,  // Deprecated: use server.port instead
  open: false
}