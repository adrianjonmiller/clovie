---
sidebar_position: 12
title: Build & development
description: Configure minification, sitemap generation, hot reload, and environment-specific settings for builds and the dev server.
---

# Build & Development

## Static Site Build Options

```javascript
export default {
  type: 'static',
  
  // Minification
  minify: true,                    // Minify HTML, CSS, JS
  
  // SEO optimizations
  generateSitemap: true,           // Generate sitemap.xml
  baseUrl: 'https://mysite.com',   // Base URL for sitemap
  
  // Asset optimization
  optimizeImages: true,            // Optimize image files
  inlineCSS: false,                // Inline critical CSS
  
  // Build performance
  parallel: true,                  // Parallel processing
  cache: true,                     // Enable build caching
  
  // Output customization
  outputDir: './dist',
  assetsDir: 'assets',             // Assets subdirectory in output
  publicPath: '/'                  // Public path for assets
};
```

## Server Build Options

```javascript
export default {
  type: 'server',
  
  // Asset processing
  minify: process.env.NODE_ENV === 'production',
  
  // Development options
  hotReload: true,                 // Enable hot reload in development
  watchConfig: true,               // Watch config file for changes
  
  // Production optimizations
  compression: true,               // Enable gzip compression
  etags: true,                     // Enable ETags for caching
  
  // Build output
  outputDir: './dist',
  staticPath: '/static'            // Path to serve static assets
};
```

## Development Server

```javascript
export default {
  // Development server settings
  port: 3000,                      // Server port
  host: 'localhost',               // Server host
  
  // Live reload
  liveReload: true,                // Enable live reload
  watchFiles: ['views/**/*', 'styles/**/*'], // Additional files to watch
  
  // Development mode detection
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Logging
  verbose: true,                   // Verbose logging
  logLevel: 'debug'                // Log level: 'error', 'warn', 'info', 'debug'
};
```

## Environment-Specific Configuration

```javascript
const isDev = process.env.NODE_ENV !== 'production';

export default {
  type: 'server',
  port: process.env.PORT || 3000,
  
  // Environment-specific settings
  ...(isDev && {
    // Development settings
    liveReload: true,
    verbose: true
  }),
  
  ...(!isDev && {
    // Production settings
    minify: true,
    compression: true
  }),
  
  data: {
    site: {
      url: isDev ? 'http://localhost:3000' : 'https://myapp.com'
    }
  }
};
```
