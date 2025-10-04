import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  // Project structure
  views: path.join(__dirname, 'views'),
  scripts: path.join(__dirname, 'scripts'), 
  styles: path.join(__dirname, 'styles'),
  assets: path.join(__dirname, 'assets'),
  partials: path.join(__dirname, 'partials'),
  outputDir: path.join(__dirname, 'dist'),
  
  // Data
  data: {
    site: {
      title: 'My Dev Site',
      description: 'Testing Clovie in development',
      author: 'Developer'
    },
    pages: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about.html' },
    ]
  },
  
  // Template compiler
  templateCompiler: (template, data) => {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (err) {
      console.warn(`Template compilation error: ${err.message}`);
      return template;
    }
  },
  
  templateRegister: (name, template) => {
    Handlebars.registerPartial(name, template);
  },
  
  // Development settings
  watch: true,
  port: 3000,
  mode: 'development',
  type: 'static',
  routes: [
    {
      path: 'procucts/:slug',
      template: 'index.html',
      repeat: (state) => state.get(['pages']),
      data: (state, item) => {
        return state.get()
      }
    }
  ]
};
