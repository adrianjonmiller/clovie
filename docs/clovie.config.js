import Handlebars from 'handlebars';
import * as sass from 'sass';

// Detect environment
const isNetlify = process.env.NETLIFY === 'true';
const isProduction = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
const isDevelopment = !isProduction;

export default {
  // Project structure
  views: './views',
  partials: './partials', 
  scripts: './scripts',
  styles: './styles',
  outputDir: './dist',
  
  // Environment-aware settings
  mode: isDevelopment ? 'development' : 'production',
  port: isDevelopment ? 3002 : 3000, // Different port for development
  
  // Template compilation - Handlebars
  templateCompiler: (template, data) => {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (err) {
      console.warn(`⚠️  Handlebars compilation error: ${err.message}`);
      return template;
    }
  },
  
  templateRegister: (name, template) => {
    Handlebars.registerPartial(name, template);
  },
  
  // Style compilation - Sass
  styleCompiler: async (content, filePath) => {
    try {
      const result = sass.compileString(content, {
        style: isProduction ? 'compressed' : 'expanded',
        sourceMap: isDevelopment,
        verbose: isDevelopment
      });
      return result.css;
    } catch (err) {
      console.warn(`⚠️  Sass compilation error in ${filePath}: ${err.message}`);
      return content; // Fallback to raw content
    }
  },
  
  // Site data
  data: {
    title: 'Clovie Documentation',
    description: 'Single‑page documentation for Clovie, a simple, fast, modular Node.js static site generator.',
    version: '0.1.4',
    environment: isProduction ? 'production' : 'development',
    isNetlify,
    buildTime: new Date().toISOString()
  }
};
