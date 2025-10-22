# Vite App Integration with Clovie

This example shows how to integrate a Vite application into your Clovie project.

## Project Structure

```
my-clovie-project/
├── clovie.config.js
├── apps/
│   └── admin/
│       ├── package.json
│       ├── vite.config.js
│       ├── index.html
│       ├── src/
│       │   ├── main.js
│       │   ├── App.vue
│       │   └── components/
│       └── dist/ (generated)
├── views/
├── scripts/
├── styles/
└── dist/
```

## 1. Create the Vite App

First, create your Vite application in the `apps/admin` directory:

```bash
cd apps/admin
npm create vite@latest . -- --template vue
npm install
```

## 2. Configure Vite

Update `apps/admin/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure the app can be served from a subdirectory
    base: '/admin/',
    rollupOptions: {
      output: {
        // Ensure consistent file naming
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    // Proxy API calls to Clovie server
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

## 3. Update Clovie Configuration

Update your `clovie.config.js`:

```javascript
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
    }
  ],
  
  // Data for the main site
  data: {
    site: {
      title: 'My Clovie Site with Admin Panel',
      description: 'A Clovie site with an integrated Vite admin panel'
    }
  },
  
  // Routes that serve the built apps
  routes: [
    {
      path: '/admin',
      template: path.join(__dirname, 'apps/admin/index.html'),
      data: () => ({ 
        appName: 'admin-panel',
        title: 'Admin Panel'
      })
    }
  ],
  
  // API routes for the admin panel
  api: [
    {
      method: 'GET',
      path: '/api/admin/users',
      handler: async (context) => {
        return context.respond.json({
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ]
        });
      }
    }
  ]
};
```

## 4. Create the Admin Template

Create `apps/admin/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{title}} - {{site.title}}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

## 5. Development Workflow

1. **Start Clovie development server:**
   ```bash
   npm run dev
   ```

2. **Clovie will automatically:**
   - Detect the Vite app configuration
   - Build the Vite app using `vite build`
   - Watch for changes and rebuild as needed
   - Serve the built app at `/admin`

3. **Access your app:**
   - Main Clovie site: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`

## 6. Production Build

For production, Clovie will:
- Build all configured apps in production mode
- Optimize assets and code
- Serve everything from the unified `dist` directory

## Benefits

- **Unified Development**: One command starts everything
- **Shared API**: Apps can use Clovie's API routes
- **Consistent Routing**: All apps served from the same domain
- **Hot Reload**: Both Clovie and Vite apps support live reload
- **Production Ready**: Optimized builds for all environments

## Advanced Configuration

You can configure multiple apps with different build tools:

```javascript
apps: [
  {
    name: 'admin-vue',
    source: './apps/admin-vue',
    buildTool: 'vite',
    outputPath: '/admin'
  },
  {
    name: 'dashboard-react',
    source: './apps/dashboard-react',
    buildTool: 'webpack',
    outputPath: '/dashboard'
  }
]
```
