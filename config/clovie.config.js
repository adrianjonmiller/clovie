import Handlebars from 'handlebars';
import path from 'path';

export default {
  // Smart defaults - these paths are automatically detected
  scripts: null,        // Will auto-detect if not specified
  styles: null,         // Will auto-detect if not specified
  assets: null,         // Will auto-detect if not specified
  views: null,
  partials: null,
  outputDir: path.resolve('./dist/'),
  
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
  port: 3000,
  open: false,
  routes: [
    {
      name: 'Products',
      path: '/products/:slug',
      template: 'index.html',
      repeat: (state) => {
        return state.get(['products'])
      },
      data: (state, item) => {
        return {
          ...item,
          slug: item.name,
          title: item.name
        }
      }
    }
  ]
}