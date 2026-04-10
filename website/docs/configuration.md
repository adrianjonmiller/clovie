---
sidebar_position: 2
title: Configuration reference
description: Complete reference for clovie.config.js — static and server modes, routes, API factories, middleware, and apps.
---

# Clovie Configuration Guide

Complete reference for `clovie.config.js` configuration options.

## 📋 Table of Contents

- [Basic Configuration](#basic-configuration)
- [Static Site Mode](#static-site-mode) 
- [Server Application Mode](#server-application-mode)
- [File Paths & Structure](#file-paths--structure)
- [Data & State Management](#data--state-management)
- [Template Engines](#template-engines)
- [Routes & Dynamic Pages](#routes--dynamic-pages)
- [Factories for api, routes, middleware, and hooks](#factories-for-api-routes-middleware-and-hooks)
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Build Options](#build-options)
- [Development Settings](#development-settings)

## Basic Configuration

### Minimal Setup (Zero Config)

Clovie works with zero configuration using smart auto-detection:

```javascript
// clovie.config.js
export default {
  data: {
    title: 'My Site'
  }
};
```

Auto-detects:
- `views/` → HTML templates
- `scripts/main.js` → JavaScript entry
- `styles/main.scss` → SCSS entry  
- `assets/` → Static assets
- `partials/` → Reusable components

### Configuration Object Structure

```javascript
export default {
  // Core settings
  type: 'static' | 'server',
  mode: 'development' | 'production',
  
  // File paths
  views: './views',
  scripts: './scripts',
  styles: './styles', 
  assets: './assets',
  partials: './partials',
  outputDir: './dist',
  
  // Data and templating
  data: {},
  renderEngine: Function | String,
  
  // Routes and APIs (server mode)
  routes: [],
  api: [],
  middleware: [],
  
  // Build options
  minify: false,
  generateSitemap: false
};
```

## Static Site Mode

Perfect for blogs, documentation, and marketing sites.

### Basic Static Configuration

```javascript
export default {
  type: 'static', // Generate static HTML files
  
  data: {
    site: {
      title: 'My Blog',
      description: 'A fast static blog',
      url: 'https://myblog.com'
    },
    author: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  
  // Build optimizations
  minify: true,
  generateSitemap: true
};
```

### Static with Dynamic Pages

Generate multiple pages from data:

```javascript
export default {
  type: 'static',
  
  data: {
    posts: [
      { 
        id: 1, 
        title: 'Getting Started',
        slug: 'getting-started',
        content: 'Welcome to my blog...',
        date: '2024-01-01',
        category: 'tutorial'
      }
    ],
    categories: ['tutorial', 'guide', 'news']
  },
  
  routes: [
    // Individual post pages
    {
      name: 'Blog Posts',
      path: '/posts/:slug',
      template: 'post.html',
      repeat: (data) => data.posts,
      data: (globalData, post) => ({
        ...globalData,
        post,
        title: `${post.title} - ${globalData.site.title}`
      })
    },
    
    // Category listing pages  
    {
      name: 'Categories',
      path: '/category/:category',
      template: 'category.html',
      repeat: (data) => data.categories,
      data: (globalData, category) => ({
        ...globalData,
        category,
        posts: globalData.posts.filter(p => p.category === category)
      })
    }
  ]
};
```

### Async Data Loading

Load content from external sources at build time:

```javascript
export default {
  type: 'static',
  
  data: async () => {
    // Fetch from API
    const posts = await fetch('https://api.example.com/posts')
      .then(r => r.json());
    
    // Load from files
    const authors = await loadAuthorsFromFile('./data/authors.json');
    
    return {
      site: { title: 'My Blog' },
      posts,
      authors,
      buildTime: new Date().toISOString()
    };
  }
};
```

## Server Application Mode

Full Express.js applications with APIs and server-side rendering.

### Basic Server Configuration

```javascript
import express from 'express';

export default {
  type: 'server',
  port: 3000,
  
  data: {
    app: {
      name: 'My App',
      version: '1.0.0'
    }
  },
  
  middleware: [
    express.json(),
    express.urlencoded({ extended: true })
  ]
};
```

## File Paths & Structure

### Path Configuration

```javascript
export default {
  // Input directories
  views: './src/templates',      // HTML templates
  scripts: './src/js/app.js',    // JavaScript entry point
  styles: './src/scss/main.scss', // SCSS entry point
  assets: './public',            // Static files
  partials: './src/partials',    // Reusable components
  
  // Output
  outputDir: './build',          // Build output directory
};
```

### Auto-Detection Rules

If paths are not specified, Clovie automatically detects:

1. **Views**: `./views/` directory
2. **Scripts**: `./scripts/main.js` or `./scripts/app.js`
3. **Styles**: `./styles/main.scss` or `./styles/main.css`
4. **Assets**: `./assets/` directory
5. **Partials**: `./partials/` directory
6. **Output**: `./dist/` directory

## Data & State Management

### Static Data

```javascript
export default {
  data: {
    // Site metadata
    site: {
      title: 'My Site',
      description: 'A great website',
      url: 'https://mysite.com'
    },
    
    // Navigation
    nav: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' }
    ],
    
    // Content data
    posts: [],
    projects: [],
    
    // Build info
    buildDate: new Date().toISOString()
  }
};
```

### Async Data (Static Mode)

```javascript
export default {
  data: async () => {
    try {
      // Multiple async operations
      const [posts, projects, config] = await Promise.all([
        loadPostsFromMarkdown('./content/posts/'),
        loadProjectsFromAPI('https://api.github.com/users/myuser/repos'),
        loadSiteConfig('./site.config.json')
      ]);
      
      return {
        ...config,
        posts,
        projects,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.warn('Data loading failed:', error);
      return { 
        posts: [], 
        projects: [],
        lastUpdated: Date.now()
      };
    }
  }
};
```

### Server State Management

In server mode, reactive **state** is available on the request context in API **`handler`** functions and in route **`data`** functions:

```javascript
api: [{
  path: '/api/users',
  method: 'POST',
  handler: async (ctx) => {
    const users = ctx.state.get('users') || [];
    const newUser = { id: Date.now(), ...(ctx.body || {}) };
    users.push(newUser);
    ctx.state.set('users', users);
    return ctx.respond.json({ success: true, user: newUser }, 201);
  }
}]
```

## Template Engines

### Built-in Support

Clovie supports popular template engines out of the box:

```javascript
// Handlebars
import Handlebars from 'handlebars';
export default {
  renderEngine: (template, data) => {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }
};

// Nunjucks
import nunjucks from 'nunjucks';
export default {
  renderEngine: (template, data) => {
    return nunjucks.renderString(template, data);
  }
};

// Pug
import pug from 'pug';
export default {
  renderEngine: (template, data) => {
    return pug.render(template, { ...data, pretty: true });
  }
};
```

### Custom Template Engine

```javascript
export default {
  renderEngine: (template, data) => {
    // Simple variable replacement
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
};
```

### String-based Engine Selection

```javascript
export default {
  renderEngine: 'handlebars', // Auto-configures Handlebars
  // Also supports: 'nunjucks', 'pug', 'mustache', 'eta'
};
```

## Routes & Dynamic Pages

Routes generate multiple pages from data in static mode, or handle dynamic requests in server mode.

### Route Object Structure

```javascript
{
  name: 'Display Name',          // Optional: Route description
  path: '/posts/:slug',          // URL pattern with parameters
  template: 'post.html',         // Template file to render
  method: 'GET',                 // HTTP method (server mode only)
  repeat: (data) => data.posts,  // Generate multiple pages from array
  data: (globalData, item, params) => ({}) // Data function for template
}
```

### Static Route Examples

```javascript
export default {
  type: 'static',
  
  data: {
    posts: [/* ... */],
    categories: [/* ... */],
    tags: [/* ... */]
  },
  
  routes: [
    // Individual posts
    {
      name: 'Blog Posts',
      path: '/posts/:slug',
      template: 'post/single.html',
      repeat: (data) => data.posts,
      data: (globalData, post) => ({
        ...globalData,
        post,
        title: post.title,
        relatedPosts: globalData.posts
          .filter(p => p.category === post.category && p.id !== post.id)
          .slice(0, 3)
      })
    },
    
    // Category pages
    {
      name: 'Category Pages',
      path: '/category/:category',
      template: 'category/index.html',
      repeat: (data) => data.categories,
      data: (globalData, category) => ({
        ...globalData,
        category,
        posts: globalData.posts.filter(p => p.category === category),
        title: `${category} Posts`
      })
    },
    
    // Tag pages with pagination
    {
      name: 'Tag Pages',
      path: '/tag/:tag/:page?',
      template: 'tag/index.html',
      repeat: (data) => data.tags,
      paginate: 10,
      data: (globalData, tag, pageInfo) => ({
        ...globalData,
        tag,
        posts: globalData.posts.filter(p => p.tags.includes(tag)),
        pagination: pageInfo
      })
    }
  ]
};
```

### Server Route Examples

```javascript
export default {
  type: 'server',
  
  routes: [
    // Server-rendered user profiles
    {
      name: 'User Profile',
      path: '/user/:id',
      template: 'user/profile.html',
      data: async (state, params) => {
        const user = await getUserById(params.id);
        const posts = await getUserPosts(params.id);
        const stats = await getUserStats(params.id);
        
        return {
          user,
          posts,
          stats,
          title: `${user.name}'s Profile`
        };
      }
    },
    
    // Dynamic product pages
    {
      name: 'Product Details',
      path: '/products/:category/:slug',
      template: 'product/details.html',
      data: async (state, params) => {
        const product = await getProductBySlug(params.category, params.slug);
        const related = await getRelatedProducts(product.id);
        
        return {
          product,
          related,
          breadcrumb: [
            { title: 'Products', url: '/products' },
            { title: params.category, url: `/products/${params.category}` },
            { title: product.name }
          ]
        };
      }
    }
  ]
};
```

## Factories for api, routes, middleware, and hooks

Clovie registers server HTTP layers through **factory definitions** from `@jucie.io/engine-server` (re-exported from the `clovie` package). At runtime the `Run` service builds one ordered list and calls `server.use(...)` with:

1. **`hooks`** — `defineHooks(name, (useContext, opts) => hookObject)`
2. **`middleware`** — `defineMiddleware(name, (useContext, opts) => middlewareFns)` or plain Express-style functions
3. **`api`** — `defineRoutes` / `defineApi` (same function) plus raw route objects
4. **Generated routes** — `views/` and your **`routes`** array (also normalized through `defineRoutes`)

### Why factories matter

- **`useContext`** — resolve engine services (`log`, `file`, etc.) when the server starts, not at module top level.
- **Composition** — export `defineRoutes('billing', ...)` from `api/billing.js` and spread factories into `api: [...]`.
- **Mixed config** — `api` (and other keys) accept **raw objects**, **arrays of routes**, **single factories**, or **arrays mixing both**; `normalizeToFactories` batches raw items and preserves real factories.

### Imports

```javascript
import {
  defineApi,          // alias of defineRoutes — useful for api: []
  defineRoutes,
  defineMiddleware,
  defineHooks,
} from 'clovie';
```

### Example: API split across modules

```javascript
import { defineRoutes } from 'clovie';

export const catalogApi = defineRoutes('catalog', (useContext, opts) => [
  {
    method: 'GET',
    path: '/items',
    handler: (ctx) => ctx.respond.json({ items: [] }),
  },
]);

export default {
  type: 'server',
  api: [
    catalogApi,
    {
      method: 'GET',
      path: '/api/health',
      handler: (ctx) => ctx.respond.json({ ok: true }),
    },
  ],
};
```

Use the same pattern for **`routes`** when SSR handlers need `useContext`, and for **`middleware`** / **`hooks`** with `defineMiddleware` / `defineHooks`.

## API Endpoints

Server mode registers REST-style endpoints as **engine-server routes** with a **`handler`** function. When Express middleware is configured, Clovie uses the Express adapter; otherwise it uses the faster native HTTP stack.

### API route shape

```javascript
{
  path: '/api/users/:id',       // URL pattern (leading segments often include /api/…)
  method: 'GET',               // HTTP verb
  handler: async (ctx) => {    // Returns a response descriptor via ctx.respond.*
    return ctx.respond.json({ id: ctx.params.id });
  }
}
```

### Handler context (`ctx`)

Typical fields (see also `lib/types/kernel.js`):

- **`ctx.req`** — method, url, headers
- **`ctx.params`**, **`ctx.query`**, **`ctx.body`** — parsed request pieces
- **`ctx.state`** — reactive state (`get` / `set` where provided by the engine)
- **`ctx.respond.json(data, status)`**, **`.html()`**, **`.text()`**, **`.file()`** — structured responses

### Complete API examples (handlers + state)

```javascript
export default {
  type: 'server',

  api: [
    {
      path: '/api/users',
      method: 'GET',
      handler: async (ctx) => {
        let users = ctx.state.get('users') || [];

        if (ctx.query.search) {
          const q = String(ctx.query.search).toLowerCase();
          users = users.filter((u) => u.name.toLowerCase().includes(q));
        }

        const page = parseInt(ctx.query.page, 10) || 1;
        const limit = parseInt(ctx.query.limit, 10) || 10;
        const start = (page - 1) * limit;
        const slice = users.slice(start, start + limit);

        return ctx.respond.json({
          users: slice,
          pagination: {
            page,
            limit,
            total: users.length,
            totalPages: Math.ceil(users.length / limit),
          },
        });
      },
    },

    {
      path: '/api/users',
      method: 'POST',
      handler: async (ctx) => {
        const { name, email, age } = ctx.body || {};
        const errors = [];
        if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
        if (!email || !email.includes('@')) errors.push('Valid email required');
        if (age != null && (age < 13 || age > 120)) errors.push('Age must be between 13 and 120');

        if (errors.length) {
          return ctx.respond.json({ error: 'Validation failed', errors }, 400);
        }

        const users = ctx.state.get('users') || [];
        if (users.find((u) => u.email === email)) {
          return ctx.respond.json({ error: 'Email already exists' }, 409);
        }

        const newUser = {
          id: Date.now(),
          name,
          email,
          age: age ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        users.push(newUser);
        ctx.state.set('users', users);

        return ctx.respond.json({ success: true, user: newUser }, 201);
      },
    },

    {
      path: '/api/users/:id',
      method: 'PUT',
      handler: async (ctx) => {
        const userId = parseInt(ctx.params.id, 10);
        const users = ctx.state.get('users') || [];
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
          return ctx.respond.json({ error: 'User not found' }, 404);
        }
        const updatedUser = {
          ...users[userIndex],
          ...(ctx.body || {}),
          updatedAt: new Date().toISOString(),
        };
        users[userIndex] = updatedUser;
        ctx.state.set('users', users);
        return ctx.respond.json({ success: true, user: updatedUser });
      },
    },

    {
      path: '/api/users/:id',
      method: 'DELETE',
      handler: async (ctx) => {
        const userId = parseInt(ctx.params.id, 10);
        const users = ctx.state.get('users') || [];
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
          return ctx.respond.json({ error: 'User not found' }, 404);
        }
        const [deletedUser] = users.splice(userIndex, 1);
        ctx.state.set('users', users);
        return ctx.respond.json({ success: true, user: deletedUser });
      },
    },

    {
      path: '/api/upload',
      method: 'POST',
      handler: async (ctx) => {
        const file = ctx.body?.file;
        if (!file) {
          return ctx.respond.json({ error: 'No file uploaded' }, 400);
        }
        const fileRecord = {
          id: Date.now(),
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString(),
        };
        const files = ctx.state.get('files') || [];
        files.push(fileRecord);
        ctx.state.set('files', files);
        return ctx.respond.json({ success: true, file: fileRecord });
      },
    },
  ],
};
```

## Middleware

Express middleware functions that run before routes and API endpoints. When you configure middleware, Clovie automatically uses the Express adapter for full compatibility with the Express middleware ecosystem.

### Basic Middleware Setup

```javascript
import express from 'express';
import cors from 'cors';

export default {
  type: 'server',
  
  middleware: [
    express.json({ limit: '10mb' }),           // Parse JSON bodies
    express.urlencoded({ extended: true }),    // Parse form data
    cors({ origin: 'https://myapp.com' }),     // CORS configuration
    express.static('public')                   // Serve static files
  ]
};
```

**Note:** Clovie automatically switches to the Express adapter when middleware is configured. If no middleware is present, it uses the faster HTTP adapter.

### Authentication Middleware (Most Common Pattern)

Authentication is the most common middleware use case. Here are practical patterns:

#### Selective Authentication (Protect Specific Routes)

```javascript
export default {
  type: 'server',
  
  middleware: [
    // Basic request logging
    (req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
      next();
    },
    
    // Selective authentication - only protect certain routes
    (req, res, next) => {
      // Public routes that don't need authentication
      const publicPaths = [
        '/api/login',
        '/api/register',
        '/api/health',
        '/api/docs'
      ];
      
      // Skip auth for public routes
      if (publicPaths.some(path => req.url.startsWith(path))) {
        return next();
      }
      
      // Protect all /api/protected/* routes
      if (req.url.startsWith('/api/protected/')) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please provide a Bearer token'
          });
        }
        
        try {
          // In a real app, verify JWT token here
          const user = verifyJWT(token);
          req.user = user; // Attach user info to request
          next();
        } catch (error) {
          return res.status(401).json({ 
            error: 'Invalid token',
            message: 'Token verification failed'
          });
        }
      } else {
        // All other routes pass through
        next();
      }
    }
  ],
  
  api: [
    // Public endpoint - no auth needed
    {
      method: 'GET',
      path: '/api/login',
      handler: (ctx) => ctx.respond.json({ message: 'Login endpoint' })
    },
    
    // Protected endpoint - requires Bearer token
    {
      method: 'GET', 
      path: '/api/protected/profile',
      handler: (ctx) => {
        // ctx.req.user is available thanks to auth middleware
        return ctx.respond.json({ 
          user: ctx.req.raw.req.user,
          message: 'This is protected data'
        });
      }
    }
  ]
};
```

#### Simple API Key Authentication

```javascript
export default {
  type: 'server',
  
  middleware: [
    (req, res, next) => {
      // Only protect API routes
      if (!req.url.startsWith('/api/')) {
        return next();
      }
      
      const apiKey = req.headers['x-api-key'];
      const validKeys = process.env.API_KEYS?.split(',') || [];
      
      if (!apiKey || !validKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'Provide a valid X-API-Key header'
        });
      }
      
      next();
    }
  ]
};
```

#### Session-Based Authentication

```javascript
import session from 'express-session';

export default {
  type: 'server',
  
  middleware: [
    // Session middleware
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }),
    
    // Auth middleware using sessions
    (req, res, next) => {
      // Protect admin routes
      if (req.url.startsWith('/admin/')) {
        if (!req.session.user || req.session.user.role !== 'admin') {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Admin access required'
          });
        }
      }
      
      next();
    }
  ]
};
```

### Testing Your Auth Middleware

```bash
# Test public endpoint (should work)
curl http://localhost:3000/api/health

# Test protected endpoint without token (should return 401)
curl http://localhost:3000/api/protected/profile

# Test protected endpoint with token (should work)
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/protected/profile

# Test with API key
curl -H "X-API-Key: your-key" http://localhost:3000/api/data
```

### Middleware Execution Order

Middleware executes in **array order**. This is critical for auth flows:

```javascript
export default {
  middleware: [
    cors(),                    // 1. CORS (must be first)
    express.json(),           // 2. Body parsing
    requestLogger,            // 3. Logging
    rateLimiter,             // 4. Rate limiting
    authenticateUser,        // 5. Authentication (after parsing, before business logic)
    authorizeUser           // 6. Authorization (after auth)
  ]
};
```

### Common Middleware Patterns

```javascript
// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Middleware error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

// Request timeout middleware  
const timeout = (ms) => (req, res, next) => {
  const timer = setTimeout(() => {
    res.status(408).json({ error: 'Request timeout' });
  }, ms);
  
  res.on('finish', () => clearTimeout(timer));
  next();
};

// Custom headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

export default {
  type: 'server',
  middleware: [
    timeout(30000),           // 30 second timeout
    securityHeaders,          // Security headers
    express.json(),
    // ... your auth middleware
    errorHandler             // Error handling (should be last)
  ]
};
```

### Middleware for File Uploads

```javascript
import multer from 'multer';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

export default {
  type: 'server',
  
  middleware: [
    express.json(),
    upload.single('image')  // Expect single file with field name 'image'
  ]
};
```

## Build Options

Configuration options for optimizing builds and output.

### Static Site Build Options

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

### Server Build Options

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

## Development Settings

Configuration for development environment and tooling.

### Development Server

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

### Environment-Specific Configuration

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

## Apps Integration

Clovie can orchestrate and serve external app builds (Vite, Webpack, Rollup, esbuild) alongside your project. Declare apps in your configuration and Clovie will build them during `clovie build` / `clovie serve`, watch them in `clovie dev`, and mount their dev middleware or static output on the HTTP server automatically via kernel-level handlers (no Express-specific middleware required).

### Configuration Structure

```javascript
export default {
  type: 'server',
  // ...other config

  apps: [
    {
      name: 'studio',           // Identifier (used for logs and mount path)
      source: './apps/studio',  // Directory containing the app
      buildTool: 'vite',        // Optional: vite | webpack | rollup | esbuild (auto-detected if omitted)
      config: './apps/studio/vite.config.js', // Optional explicit config path
      outputPath: './dist/studio',            // Optional build output directory

      buildOptions: {
        watch: true,            // Enable watch mode during clovie dev
        build: {                // Additional tool-specific build options (passed to Vite, etc.)
          outDir: './dist/studio'
        }
      },

      dev: {
        mountPath: '/studio',   // Where to mount dev middleware/static assets
        server: {               // Additional Vite dev server options (middleware mode is set automatically)
          hmr: true
        },
        index: './apps/studio/index.html' // Custom index file for HTML responses
      }
    }
  ]
};
```

### Vite Example

```javascript
export default {
  type: 'server',
  apps: [
    {
      name: 'admin',
      source: './apps/admin',
      buildTool: 'vite',
      config: './apps/admin/vite.config.ts',
      buildOptions: {
        watch: true,
        build: { outDir: './apps/admin/dist' }
      },
      dev: {
        mountPath: '/admin'
      }
    }
  ]
};
```

During development `clovie dev` will start Vite in middleware mode and mount it at `/admin`. In production `clovie serve` serves the built assets from `/admin` using the generated bundle.

### Webpack Example

```javascript
export default {
  type: 'server',
  apps: [
    {
      name: 'dashboard',
      source: './apps/dashboard',
      buildTool: 'webpack',
      config: './apps/dashboard/webpack.config.js',
      buildOptions: {
        watch: true,
        devMiddleware: {
          publicPath: '/dashboard/'
        }
      },
      dev: {
        mountPath: '/dashboard'
      }
    }
  ]
};
```

Clovie will use webpack’s programmatic API for builds and attach `webpack-dev-middleware` at `/dashboard` during development.

### Rollup Example

```javascript
export default {
  type: 'server',
  apps: [
    {
      name: 'docs',
      source: './apps/docs',
      buildTool: 'rollup',
      config: './apps/docs/rollup.config.js',
      outputPath: './apps/docs/dist',
      buildOptions: {
        watch: true
      },
      dev: {
        mountPath: '/docs'
      }
    }
  ]
};
```

Rollup projects are watched via `rollup.watch()`. During development the generated files are served from the output directory, so configure your rollup bundle to write to disk (default).

### esbuild Example

```javascript
export default {
  type: 'server',
  apps: [
    {
      name: 'viewer',
      source: './apps/viewer',
      buildTool: 'esbuild',
      entryPoints: ['./apps/viewer/src/main.tsx'],
      outputPath: './apps/viewer/dist',
      buildOptions: {
        watch: true,
        esbuild: {
          bundle: true,
          target: 'es2020'
        }
      },
      dev: {
        mountPath: '/viewer'
      }
    }
  ]
};
```

If you provide an esbuild config module via `config`, Clovie will merge the exported options.

### Behavior Summary

- **Auto-detected build tools:** If `buildTool` is omitted Clovie inspects `package.json` scripts and config files inside the app directory.
- **Builds:** `clovie build` and `clovie serve` run `apps.build()` before starting the server, producing bundles in the configured `outputPath`.
- **Dev mode:** `clovie dev` runs tool-specific watchers and mounts dev middleware (Vite/webpack) or serves the watched output (Rollup/esbuild) at `dev.mountPath`.
- **Cleanup:** Dev servers and watchers are closed automatically when Clovie shuts down.

---

*This configuration guide covers all major Clovie features. For more examples, see the [examples directory](https://github.com/adrianjonmiller/clovie/tree/main/examples) and [template configurations](https://github.com/adrianjonmiller/clovie/tree/main/templates).*