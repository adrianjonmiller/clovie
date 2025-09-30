import Handlebars from 'handlebars';
import * as sass from 'sass';

export default {
  // Project structure
  views: './views',
  partials: './partials', 
  scripts: './scripts',
  styles: './styles',
  outputDir: './dist',
  
  // Development mode
  mode: 'development',
  port: 3002, // Different port from dev-project
  
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
        style: 'expanded',
        sourceMap: false
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
    version: '0.1.4'
  }
};
