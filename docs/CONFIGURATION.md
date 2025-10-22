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
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Database Integration](#database-integration)
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
  
  // Database (server mode)
  dbPath: './data/app.db',
  
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

### Server with Database

```javascript
export default {
  type: 'server',
  port: 3000,
  
  // SQLite database
  dbPath: './data/app.db',
  
  data: {
    app: { name: 'My App' }
  },
  
  api: [{
    path: '/api/posts',
    method: 'GET',
    action: async (state, event) => {
      const posts = await state.db.query('SELECT * FROM posts ORDER BY created_at DESC');
      return { posts };
    }
  }]
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
  
  // Database (server mode)
  dbPath: './data/app.db'        // SQLite database path
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

In server mode, state is available in API actions and route data functions:

```javascript
api: [{
  path: '/api/users',
  method: 'POST',
  action: async (state, event) => {
    // Get current data
    const users = state.get('users') || [];
    
    // Add new user
    const newUser = { id: Date.now(), ...event.body };
    users.push(newUser);
    
    // Save back to state
    state.set('users', users);
    
    return { success: true, user: newUser };
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

## API Endpoints

Server mode supports REST API endpoints with full Express.js functionality.

### API Endpoint Structure

```javascript
{
  path: '/api/users/:id',         // URL pattern
  method: 'GET',                  // HTTP method
  action: async (state, event) => ({}) // Handler function
}
```

### API Handler Context

The `action` function receives:
- **`state`**: State management object with `get()` and `set()` methods
- **`event`**: Request context object

Event object contains:
```javascript
{
  params: {},    // URL parameters (/users/:id -> { id: '123' })
  query: {},     // Query parameters (?search=term -> { search: 'term' })
  body: {},      // Request body (JSON)
  headers: {},   // Request headers
  method: '',    // HTTP method
  url: ''        // Full request URL
}
```

### Complete API Examples

```javascript
export default {
  type: 'server',
  
  api: [
    // Get all users with filtering
    {
      path: '/api/users',
      method: 'GET',
      action: async (state, event) => {
        let users = state.get('users') || [];
        
        // Filter by query parameters
        if (event.query.search) {
          users = users.filter(u => 
            u.name.toLowerCase().includes(event.query.search.toLowerCase())
          );
        }
        
        // Pagination
        const page = parseInt(event.query.page) || 1;
        const limit = parseInt(event.query.limit) || 10;
        const start = (page - 1) * limit;
        const paginatedUsers = users.slice(start, start + limit);
        
        return {
          users: paginatedUsers,
          pagination: {
            page,
            limit,
            total: users.length,
            totalPages: Math.ceil(users.length / limit)
          }
        };
      }
    },
    
    // Create new user with validation
    {
      path: '/api/users',
      method: 'POST',
      action: async (state, event) => {
        const { name, email, age } = event.body;
        
        // Validation
        const errors = [];
        if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
        if (!email || !email.includes('@')) errors.push('Valid email required');
        if (age && (age < 13 || age > 120)) errors.push('Age must be between 13 and 120');
        
        if (errors.length > 0) {
          return { error: 'Validation failed', errors, status: 400 };
        }
        
        // Check for duplicate email
        const users = state.get('users') || [];
        if (users.find(u => u.email === email)) {
          return { error: 'Email already exists', status: 409 };
        }
        
        // Create user
        const newUser = {
          id: Date.now(),
          name,
          email,
          age: age || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        users.push(newUser);
        state.set('users', users);
        
        return { success: true, user: newUser, status: 201 };
      }
    },
    
    // Update user
    {
      path: '/api/users/:id',
      method: 'PUT',
      action: async (state, event) => {
        const userId = parseInt(event.params.id);
        const users = state.get('users') || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          return { error: 'User not found', status: 404 };
        }
        
        // Update user
        const updatedUser = {
          ...users[userIndex],
          ...event.body,
          updatedAt: new Date().toISOString()
        };
        
        users[userIndex] = updatedUser;
        state.set('users', users);
        
        return { success: true, user: updatedUser };
      }
    },
    
    // Delete user
    {
      path: '/api/users/:id',
      method: 'DELETE',
      action: async (state, event) => {
        const userId = parseInt(event.params.id);
        const users = state.get('users') || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          return { error: 'User not found', status: 404 };
        }
        
        const deletedUser = users.splice(userIndex, 1)[0];
        state.set('users', users);
        
        return { success: true, user: deletedUser };
      }
    },
    
    // File upload endpoint
    {
      path: '/api/upload',
      method: 'POST',
      action: async (state, event) => {
        // Assumes multer middleware is configured
        const file = event.file;
        
        if (!file) {
          return { error: 'No file uploaded', status: 400 };
        }
        
        // Process file (save metadata, move to permanent location, etc.)
        const fileRecord = {
          id: Date.now(),
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString()
        };
        
        // Save file record
        const files = state.get('files') || [];
        files.push(fileRecord);
        state.set('files', files);
        
        return { success: true, file: fileRecord };
      }
    }
  ]
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

## Database Integration

Clovie includes built-in SQLite database support for server applications.

### Basic Database Setup

```javascript
export default {
  type: 'server',
  
  // Database configuration
  dbPath: './data/app.db',        // SQLite file path
  walPath: './data/app.db-wal',   // Write-ahead log path (optional)
  
  api: [{
    path: '/api/posts',
    method: 'GET',
    action: async (state, event) => {
      // Database available as state.db
      const posts = await state.db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT ?', [10]);
      return { posts };
    }
  }]
};
```

### Database Operations

```javascript
api: [
  // Query with parameters
  {
    path: '/api/posts/:id',
    method: 'GET',
    action: async (state, event) => {
      const post = await state.db.query(
        'SELECT * FROM posts WHERE id = ?', 
        [event.params.id]
      );
      return post[0] ? { post: post[0] } : { error: 'Post not found', status: 404 };
    }
  },
  
  // Insert data
  {
    path: '/api/posts',
    method: 'POST',
    action: async (state, event) => {
      const { title, content, author } = event.body;
      
      const result = await state.db.query(
        'INSERT INTO posts (title, content, author, created_at) VALUES (?, ?, ?, ?)',
        [title, content, author, new Date().toISOString()]
      );
      
      return { success: true, id: result.lastInsertRowid };
    }
  },
  
  // Update data
  {
    path: '/api/posts/:id',
    method: 'PUT',
    action: async (state, event) => {
      const { title, content } = event.body;
      
      const result = await state.db.query(
        'UPDATE posts SET title = ?, content = ?, updated_at = ? WHERE id = ?',
        [title, content, new Date().toISOString(), event.params.id]
      );
      
      return { success: true, changes: result.changes };
    }
  },
  
  // Delete data
  {
    path: '/api/posts/:id',
    method: 'DELETE',
    action: async (state, event) => {
      const result = await state.db.query(
        'DELETE FROM posts WHERE id = ?',
        [event.params.id]
      );
      
      return { success: true, changes: result.changes };
    }
  }
]
```

### Database Initialization

```javascript
export default {
  type: 'server',
  dbPath: './data/app.db',
  
  // Initialize database schema
  api: [{
    path: '/api/init-db',
    method: 'POST',
    action: async (state, event) => {
      // Create tables
      await state.db.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          author TEXT,
          created_at TEXT,
          updated_at TEXT
        )
      `);
      
      await state.db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          created_at TEXT
        )
      `);
      
      return { success: true, message: 'Database initialized' };
    }
  }]
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
    verbose: true,
    dbPath: './data/dev.db'
  }),
  
  ...(!isDev && {
    // Production settings
    minify: true,
    compression: true,
    dbPath: process.env.DATABASE_PATH || './data/production.db'
  }),
  
  data: {
    site: {
      url: isDev ? 'http://localhost:3000' : 'https://myapp.com'
    }
  }
};
```

---

*This configuration guide covers all major Clovie features. For more examples, see the [examples directory](../examples/) and [template configurations](../templates/).*