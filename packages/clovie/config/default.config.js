import Handlebars from 'handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  
  // Default compiler - simple variable replacement
  compiler: (template, data) => {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      // Handle nested properties like 'local.title'
      return key.split('.').reduce((obj, k) => obj?.[k], data) || match;
    });
  },
  
  // Development options
  watch: false,
  port: 3000,
  open: false
}