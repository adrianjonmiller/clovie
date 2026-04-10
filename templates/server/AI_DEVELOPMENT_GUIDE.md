# AI Development Guide for Clovie Server Projects

> **For AI Assistants**: This document explains how to work with Clovie server applications. Read this to understand the project structure, configuration, and development patterns. For Cursor, you can also install `clovie` and run **`clovie skills show`** to paste the bundled project skill, or copy `node_modules/clovie/.cursor/skills/clovie.mdc` into `.cursor/skills/`.

## What is Clovie Server Mode?

Clovie Server Mode creates full-stack web applications with Express-like functionality, API endpoints, and server-side rendering. It's built on a service-oriented architecture using `@jucie.io/engine`.

## Factories (`api`, `routes`, `middleware`, `hooks`)

Prefer **`defineRoutes`** / **`defineApi`** (same function), **`defineMiddleware`**, and **`defineHooks`** from `clovie` when:

- Handlers need **`useContext`** (e.g. `log`, file service) at registration time.
- You split APIs across files and export small factory modules.

`api` and `routes` accept **plain objects**, **arrays**, **one factory**, or **arrays mixing factories and raw routes**; the engine normalizes them before `server.use(...)`. Registration order: **hooks → middleware → api → SSR routes (views + `routes`)**. See the upstream [CONFIGURATION.md](https://github.com/adrianjonmiller/clovie/blob/main/docs/CONFIGURATION.md) section *Factories for api, routes, middleware, and hooks*.

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
└── dist/               # Built assets (generated)
```

## Configuration (`clovie.config.js`)

The configuration file defines API endpoints, server routes, and application behavior.

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
      { title: 'About', url: '/about' }
    ]
  },
  
  // API endpoints (RESTful JSON APIs)
  api: [
    {
      path: '/api/status',
      method: 'GET',
      handler: async (ctx) => {
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
      data: async ({ context }) => {
        return {
          title: 'Welcome to My App'
        };
      }
    }
  ]
};
```

## API Endpoints

API endpoints are defined in the `api` array and handle HTTP requests:

### Basic API Structure

```javascript
{
  path: '/api/items',
  method: 'GET',
  handler: async (ctx) => {
    return ctx.respond.json({ items: [] });
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

### API Examples

```javascript
// GET /api/items - List items
{
  path: '/api/items',
  method: 'GET',
  handler: async (ctx) => {
    return ctx.respond.json({ items: [] });
  }
}

// POST /api/items - Create item
{
  path: '/api/items',
  method: 'POST',
  handler: async (ctx) => {
    const { name } = ctx.body;
    if (!name) {
      return ctx.respond.json({ error: 'Name is required' }, 400);
    }
    return ctx.respond.json({ success: true, name }, 201);
  }
}

// GET /api/items/:id - Get item by ID
{
  path: '/api/items/:id',
  method: 'GET',
  handler: async (ctx) => {
    const { id } = ctx.params;
    return ctx.respond.json({ id });
  }
}
```

## Server-Rendered Routes

Server routes generate HTML pages with server-side rendering:

### Route Structure

```javascript
{
  name: 'Route Name',
  path: '/dashboard',
  template: 'dashboard.html',
  data: async ({ context }) => {
    return {
      title: 'Dashboard',
      user: context.req.user
    };
  }
}
```

The `setup` function receives `{ context, rerender }` and returns the template data. It can be async for data fetching:

```javascript
{
  path: '/news',
  template: 'news.html',
  data: async ({ context }) => {
    const response = await fetch('https://api.example.com/news');
    const articles = await response.json();
    return { articles, title: 'Latest News' };
  }
}
```

## Template Integration

Templates receive data from `setup` and can use any supported template engine:

### Nunjucks Example

```html
<!-- views/dashboard.html -->
<h1>{{ title }}</h1>

{% if items.length > 0 %}
  {% for item in items %}
    <article>
      <h3>{{ item.title }}</h3>
      <p>{{ item.excerpt }}</p>
    </article>
  {% endfor %}
{% else %}
  <p>No items found.</p>
{% endif %}
```

## Advanced Features

### Middleware Support

```javascript
import express from 'express';
import cors from 'cors';

export default {
  type: 'server',
  
  middleware: [
    express.json(),
    express.urlencoded({ extended: true }),
    cors({ origin: 'http://localhost:3000' }),
    
    (req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
      next();
    }
  ],
  
  api: [...]
};
```

### Server Hooks

```javascript
export default {
  hooks: {
    onRequest: async (ctx) => {
      console.log(`${ctx.req.method} ${ctx.req.url}`);
    },
    preHandler: async (ctx) => {
      if (ctx.req.url.startsWith('/api/') && !ctx.req.headers.authorization) {
        return ctx.respond.json({ error: 'Unauthorized' }, 401);
      }
    },
    onError: async (ctx, error) => {
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

### Templates
1. **Use semantic HTML**
2. **Handle missing data** with fallbacks
3. **Keep templates simple** and focused
4. **Use partials** for reusable components

This guide should help you understand and work with any Clovie server project effectively.
