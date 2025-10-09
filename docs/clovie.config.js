import Handlebars from 'handlebars';
import * as sass from 'sass';
import * as esbuild from 'esbuild';
import path from 'path';
import url from 'url';

// Detect environment
const isNetlify = process.env.NETLIFY === 'true';
const isProduction = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
const isDevelopment = !isProduction;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  type: 'static',
  // Project structure
  // views: './views', // Not needed when using routes configuration
  partials: path.join(__dirname, 'partials'), 
  scripts: path.join(__dirname, 'scripts'),
  styles: path.join(__dirname, 'styles'),
  outputDir: path.join(__dirname, 'dist'),
  
  // Environment-aware settings
  mode: isDevelopment ? 'development' : 'production',
  port: isDevelopment ? 3002 : 3000, // Different port for development

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
