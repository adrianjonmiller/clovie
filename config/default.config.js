import Handlebars from 'handlebars';
import path from 'path';

export default {
  // Smart defaults - these paths are automatically detected
  scripts: null,        // Will auto-detect if not specified
  styles: null,         // Will auto-detect if not specified
  views: null,          // Will auto-detect if not specified
  assets: null,         // Will auto-detect if not specified
  outputDir: path.resolve('./dist/'),
  
  // Data and models
  data: {},
  models: {},
  
  // Default compiler - Handlebars for powerful templating
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
  open: false
}