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
      name: 'react-app',
      source: './apps/react-app',
      template: './apps/react-app/public/index.html',
      config: './apps/react-app/webpack.config.js',
      buildTool: 'webpack',
      outputPath: '/react-app',
      buildOptions: {
        mode: 'development',
        watch: true,
        env: {
          REACT_APP_API_URL: 'http://localhost:3000/api',
          NODE_ENV: 'development'
        }
      }
    },
    {
      name: 'vue-app',
      source: './apps/vue-app',
      template: './apps/vue-app/public/index.html',
      config: './apps/vue-app/webpack.config.js',
      buildTool: 'webpack',
      outputPath: '/vue-app',
      buildOptions: {
        mode: 'development',
        watch: true,
        args: ['--progress', '--colors']
      }
    }
  ],
  
  // Data for the main site
  data: {
    site: {
      title: 'Clovie with Webpack Apps',
      description: 'Example of Clovie with external Webpack applications'
    }
  },
  
  // Routes that can serve the built apps
  routes: [
    {
      path: '/react-app',
      template: path.join(__dirname, 'apps/react-app/public/index.html'),
      data: () => ({ appName: 'react-app' })
    },
    {
      path: '/vue-app',
      template: path.join(__dirname, 'apps/vue-app/public/index.html'),
      data: () => ({ appName: 'vue-app' })
    }
  ]
};
