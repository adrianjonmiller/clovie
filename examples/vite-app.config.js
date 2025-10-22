import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  type: 'server',
  
  // Standard Clovie configuration
  views: path.join(__dirname, 'views'),
  scripts: path.join(__dirname, 'scripts'), 
  styles: path.join(__dirname, 'styles'),
  assets: path.join(__dirname, 'assets'),
  partials: path.join(__dirname, 'partials'),
  outputDir: path.join(__dirname, 'dist'),
  
  // Development settings
  watch: true,
  port: 3000,
  
  // External apps configuration
  apps: [
    {
      name: 'admin-panel',
      source: './apps/admin',
      template: './apps/admin/index.html',
      config: './apps/admin/vite.config.js',
      buildTool: 'vite',
      outputPath: '/admin',
      buildOptions: {
        mode: 'development',
        watch: true,
        env: {
          VITE_API_URL: 'http://localhost:3000/api'
        }
      }
    },
    {
      name: 'dashboard',
      source: './apps/dashboard',
      template: './apps/dashboard/index.html',
      config: './apps/dashboard/vite.config.js',
      buildTool: 'vite',
      outputPath: '/dashboard',
      buildOptions: {
        mode: 'development',
        watch: true
      }
    }
  ],
  
  // Data for the main site
  data: {
    site: {
      title: 'Clovie with Vite Apps',
      description: 'Example of Clovie with external Vite applications'
    }
  },
  
  // Routes that can serve the built apps
  routes: [
    {
      path: '/admin',
      template: path.join(__dirname, 'apps/admin/index.html'),
      data: () => ({ appName: 'admin-panel' })
    },
    {
      path: '/dashboard',
      template: path.join(__dirname, 'apps/dashboard/index.html'),
      data: () => ({ appName: 'dashboard' })
    }
  ]
};
