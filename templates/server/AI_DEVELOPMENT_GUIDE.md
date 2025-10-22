# AI Development Guide for Clovie Server Projects

> **For AI Assistants**: This document explains how to work with Clovie server applications. Read this to understand the project structure, configuration, and development patterns.

## What is Clovie Server Mode?

Clovie Server Mode creates full-stack web applications with Express-like functionality, API endpoints, server-side rendering, and a document-oriented database. It's built on a service-oriented architecture using `@brickworks/engine`.

## Project Structure

```
project/
├── clovie.config.js    # Main configuration with API routes
├── package.json        # Dependencies and scripts
├── views/              # Server-rendered HTML templates
├── partials/           # Reusable template components
├── scripts/            # Client-side JavaScript
├── styles/             # SCSS/CSS stylesheets
├── assets/             # Static files (images, fonts, etc.)
├── data/               # Database files (auto-created)
│   ├── app.db          # Database snapshot
│   └── app.wal         # Write-ahead log
└── dist/               # Built assets (generated)
```

## Configuration (`clovie.config.js`)

The configuration file defines API endpoints, server routes, database settings, and application behavior.

### Basic Server Configuration

```javascript
export default {
  type: 'server',                    // Server application mode
  port: 3000,                        // Server port
  
  renderEngine: 'nunjucks',          // Template engine
  
  data: {                            // Global application data
    app: {
      name: 'My App',
      version: '1.0.0'
    },
    nav: [
      { title: 'Home', url: '/' },
      { title: 'API', url: '/api-docs' }
    ]
  },
  
  // Database configuration
  dbPath: './data',                  // Database directory
  walPath: './data',                 // WAL directory
  
  // API endpoints (RESTful JSON APIs)
  api: [
    {
      path: '/api/status',
      method: 'GET',
      handler: async (ctx, database) => {
        return ctx.respond.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
      }
    }
  ],
  
  // Server-rendered routes (SSR pages)
  routes: [
    {
      name: 'Homepage',
      path: '/',
      template: 'index.html',
      data: async (ctx, database) => {
        return {
          title: 'Welcome to My App',
          stats: await getAppStats(database)
        };
      }
    }
  ]
};
```

## Database Operations

Clovie uses a document-oriented database with collections and SQL-like syntax:

### Basic Collection Operations

```javascript
// Get a collection
const users = database.collection('users');

// Add document (auto-generates unique ID)
const userId = users.add({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin',
  createdAt: new Date().toISOString()
});

// Get document by ID
const user = users.get([userId]);

// Update document
users.update([userId], user => ({
  ...user,
  lastSeen: new Date().toISOString(),
  loginCount: (user.loginCount || 0) + 1
}));

// Remove document
users.remove([userId]);
```

### Query Operations

```javascript
// Find single document
const admin = users.findWhere('role', '===', 'admin');

// Find all matching documents
const allAdmins = users.findAllWhere('role', '===', 'admin');

// Complex queries
const recentUsers = users.findAllWhere('createdAt', '>', '2024-01-01');

// Get all documents
const allUsers = users.keys().map(id => ({
  id,
  ...users.get([id])
}));
```

### Nested Collections

```javascript
// Create nested collections
const posts = database.collection('posts');
const comments = posts.collection('comments');

// Add nested data
const postId = posts.add({ title: 'My Post', content: '...' });
comments.set([postId, 'comment1'], {
  author: 'Alice',
  text: 'Great post!',
  timestamp: Date.now()
});

// Get nested data
const postComments = comments.get([postId]);
```

## API Endpoints

API endpoints are defined in the `api` array and handle HTTP requests:

### Basic API Structure

```javascript
{
  path: '/api/users',              // URL path
  method: 'GET',                   // HTTP method
  handler: async (ctx, database) => {  // Handler function
    // Your logic here
    return ctx.respond.json({ users: [] });
  }
}
```

### Context Object (`ctx`)

The context object provides access to request data:

```javascript
// Request information
ctx.req.method          // HTTP method (GET, POST, etc.)
ctx.req.url            // Full URL
ctx.req.headers        // Request headers

// Parsed data
ctx.body               // Request body (JSON/form data)
ctx.query              // URL query parameters (?name=value)
ctx.params             // Route parameters (:id)

// Response methods
ctx.respond.json(data, status)     // Send JSON response
ctx.respond.text(text, status)     // Send text response
ctx.respond.html(html, status)     // Send HTML response
ctx.respond.file(path, status)     // Send file response
```

### Complete API Examples

```javascript
// GET /api/users - List all users
{
  path: '/api/users',
  method: 'GET',
  handler: async (ctx, database) => {
    const users = database.collection('users');
    const allUsers = users.keys().map(id => ({
      id,
      ...users.get([id])
    }));
    
    return ctx.respond.json({
      users: allUsers,
      total: allUsers.length
    });
  }
}

// POST /api/users - Create new user
{
  path: '/api/users',
  method: 'POST',
  handler: async (ctx, database) => {
    const { name, email } = ctx.body;
    
    // Validation
    if (!name || !email) {
      return ctx.respond.json(
        { error: 'Name and email are required' },
        400
      );
    }
    
    // Check if email exists
    const users = database.collection('users');
    const existingUser = users.findWhere('email', '===', email);
    if (existingUser) {
      return ctx.respond.json(
        { error: 'Email already exists' },
        409
      );
    }
    
    // Create user
    const userId = users.add({
      name: name.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString()
    });
    
    return ctx.respond.json({
      success: true,
      user: { id: userId, ...users.get([userId]) }
    }, 201);
  }
}

// GET /api/users/:id - Get specific user
{
  path: '/api/users/:id',
  method: 'GET',
  handler: async (ctx, database) => {
    const userId = ctx.params.id;
    const users = database.collection('users');
    const user = users.get([userId]);
    
    if (!user) {
      return ctx.respond.json(
        { error: 'User not found' },
        404
      );
    }
    
    return ctx.respond.json({
      user: { id: userId, ...user }
    });
  }
}

// PUT /api/users/:id - Update user
{
  path: '/api/users/:id',
  method: 'PUT',
  handler: async (ctx, database) => {
    const userId = ctx.params.id;
    const users = database.collection('users');
    const user = users.get([userId]);
    
    if (!user) {
      return ctx.respond.json(
        { error: 'User not found' },
        404
      );
    }
    
    const updates = ctx.body;
    
    // Update user
    users.update([userId], user => ({
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
    
    return ctx.respond.json({
      success: true,
      user: { id: userId, ...users.get([userId]) }
    });
  }
}

// DELETE /api/users/:id - Delete user
{
  path: '/api/users/:id',
  method: 'DELETE',
  handler: async (ctx, database) => {
    const userId = ctx.params.id;
    const users = database.collection('users');
    const user = users.get([userId]);
    
    if (!user) {
      return ctx.respond.json(
        { error: 'User not found' },
        404
      );
    }
    
    users.remove([userId]);
    
    return ctx.respond.json({
      success: true,
      message: 'User deleted successfully'
    });
  }
}
```

## Server-Rendered Routes

Server routes generate HTML pages with server-side rendering:

### Basic Route Structure

```javascript
{
  name: 'Route Name',              // Descriptive name
  path: '/users/:id',             // URL pattern
  template: 'user-profile.html',  // Template file
  data: async (ctx, database) => { // Data function
    return { user: userData };
  }
}
```

### Route Examples

```javascript
// User profile page
{
  name: 'User Profile',
  path: '/user/:id',
  template: 'profile.html',
  data: async (ctx, database) => {
    const userId = ctx.params.id;
    const users = database.collection('users');
    const user = users.get([userId]);
    
    if (!user) {
      return {
        user: null,
        error: 'User not found',
        title: 'User Not Found'
      };
    }
    
    // Get user's posts
    const posts = database.collection('posts');
    const userPosts = posts.findAllWhere('authorId', '===', userId);
    
    return {
      user: { id: userId, ...user },
      posts: userPosts,
      title: `${user.name}'s Profile`
    };
  }
}

// Dashboard with statistics
{
  name: 'Dashboard',
  path: '/dashboard',
  template: 'dashboard.html',
  data: async (ctx, database) => {
    const users = database.collection('users');
    const posts = database.collection('posts');
    
    const stats = {
      totalUsers: users.keys().length,
      totalPosts: posts.keys().length,
      recentUsers: users.findAllWhere('createdAt', '>', 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ).length
    };
    
    return {
      stats,
      title: 'Dashboard'
    };
  }
}
```

## Template Integration

Templates receive data from route handlers and can use any supported template engine:

### Nunjucks Example

```html
<!-- views/profile.html -->
{% extends "layout.html" %}

{% block content %}
  {% if user %}
    <h1>{{ user.name }}</h1>
    <p>{{ user.email }}</p>
    
    {% if posts.length > 0 %}
      <h2>Posts</h2>
      {% for post in posts %}
        <article>
          <h3>{{ post.title }}</h3>
          <p>{{ post.excerpt }}</p>
        </article>
      {% endfor %}
    {% endif %}
  {% else %}
    <h1>User Not Found</h1>
    <p>{{ error }}</p>
  {% endif %}
{% endblock %}
```

## Advanced Features

### Middleware Support

Clovie automatically uses the Express adapter when middleware is configured, providing full Express middleware compatibility:

```javascript
import express from 'express';
import cors from 'cors';

export default {
  type: 'server',
  // adapter: 'express' - Auto-selected when middleware is present
  
  middleware: [
    // Standard Express middleware
    express.json(),                
    express.urlencoded({ extended: true }),
    cors({ origin: 'http://localhost:3000' }),
    
    // Custom authentication middleware
    (req, res, next) => {
      // Skip auth for public routes
      const publicPaths = ['/api/login', '/api/health'];
      if (publicPaths.some(path => req.url.startsWith(path))) {
        return next();
      }
      
      // Protect API routes
      if (req.url.startsWith('/api/')) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        try {
          // Verify JWT and attach user to request
          req.user = verifyJWT(token);
          next();
        } catch (error) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      } else {
        next();
      }
    },
    
    // Request logging
    (req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
      next();
    }
  ],
  
  api: [
    // Public endpoint - no auth required
    {
      path: '/api/login',
      method: 'POST',
      handler: (ctx, database) => {
        // Login logic here
        return ctx.respond.json({ token: 'jwt-token' });
      }
    },
    
    // Protected endpoint - requires auth middleware
    {
      path: '/api/profile',
      method: 'GET', 
      handler: (ctx, database) => {
        // Access user from middleware: ctx.req.raw.req.user
        return ctx.respond.json({ 
          user: ctx.req.raw.req.user,
          message: 'Protected data'
        });
      }
    }
  ]
};
```

**Testing Auth Middleware:**
```bash
# Public endpoint (works)
curl -X POST http://localhost:3000/api/login

# Protected endpoint without token (401 error)
curl http://localhost:3000/api/profile

# Protected endpoint with token (works)
curl -H "Authorization: Bearer jwt-token" http://localhost:3000/api/profile
```

### Server Hooks

```javascript
export default {
  // ... config
  
  hooks: {
    onRequest: async (ctx) => {
      // Log all requests
      console.log(`${ctx.req.method} ${ctx.req.url}`);
    },
    
    preHandler: async (ctx) => {
      // Authentication, rate limiting, etc.
      if (ctx.req.url.startsWith('/api/') && !ctx.req.headers.authorization) {
        return ctx.respond.json({ error: 'Unauthorized' }, 401);
      }
    },
    
    onError: async (ctx, error) => {
      // Error handling
      console.error('Server error:', error);
      return ctx.respond.json({ error: 'Internal server error' }, 500);
    }
  }
};
```

## Development Workflow

### Commands

```bash
# Development server with live reload
npm run dev

# Build assets
npm run build

# Production server
npm start

# Kill processes on ports
clovie kill --port 3000
```

### File Watching

Clovie automatically watches and rebuilds:
- Template changes → Re-render pages
- Script/style changes → Rebuild assets
- Config changes → Restart server

## Best Practices

### API Design
1. **Use proper HTTP status codes** (200, 201, 400, 404, 500)
2. **Validate input data** before processing
3. **Handle errors gracefully** with meaningful messages
4. **Use consistent response formats**
5. **Implement pagination** for list endpoints

### Database
1. **Use meaningful collection names**
2. **Add timestamps** to documents (createdAt, updatedAt)
3. **Validate data** before saving
4. **Use nested collections** for related data
5. **Handle missing documents** gracefully

### Templates
1. **Use semantic HTML**
2. **Handle missing data** with fallbacks
3. **Keep templates simple** and focused
4. **Use partials** for reusable components
5. **Test with different data scenarios**

## Common Patterns

### Authentication Flow
```javascript
// Login endpoint
{
  path: '/api/auth/login',
  method: 'POST',
  handler: async (ctx, database) => {
    const { email, password } = ctx.body;
    
    const users = database.collection('users');
    const user = users.findWhere('email', '===', email);
    
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return ctx.respond.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Update last login
    users.update([user.id], user => ({
      ...user,
      lastLogin: new Date().toISOString()
    }));
    
    return ctx.respond.json({
      success: true,
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email }
    });
  }
}
```

### Pagination
```javascript
{
  path: '/api/posts',
  method: 'GET',
  handler: async (ctx, database) => {
    const page = parseInt(ctx.query.page) || 1;
    const limit = parseInt(ctx.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const posts = database.collection('posts');
    const allPosts = posts.keys().map(id => ({ id, ...posts.get([id]) }));
    
    const paginatedPosts = allPosts.slice(offset, offset + limit);
    
    return ctx.respond.json({
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: allPosts.length,
        totalPages: Math.ceil(allPosts.length / limit)
      }
    });
  }
}
```

This guide should help you understand and work with any Clovie server project effectively.
