# AI Development Guide for Clovie Projects

> **For AI Assistants**: This document explains how to work with Clovie projects. Read this to understand the project structure, configuration, and development patterns.

## What is Clovie?

Clovie is a Node.js-based static site generator and full-stack web framework that bridges static sites and web applications. It uses a service-oriented architecture built on `@jucie.io/engine`.

## Project Structure

```
project/
├── clovie.config.js    # Main configuration file
├── package.json        # Dependencies and scripts
├── views/              # HTML templates (server-rendered)
├── partials/           # Reusable template components
├── scripts/            # Client-side JavaScript
├── styles/             # SCSS/CSS stylesheets
├── assets/             # Static files (images, fonts, etc.)
├── data/               # Database files (server mode only)
└── dist/               # Built output (generated)
```

## Configuration (`clovie.config.js`)

The configuration file is the heart of any Clovie project. It defines how the project behaves.

### Static Mode Configuration

```javascript
export default {
  type: 'static',                    // Generate static HTML files
  renderEngine: 'nunjucks',          // Template engine
  
  data: {                            // Global data available in templates
    site: { title: 'My Site' },
    nav: [{ title: 'Home', url: '/' }]
  },
  
  routes: [                          // Dynamic page generation
    {
      name: 'Blog Posts',
      path: '/posts/:slug',
      template: 'post.html',
      repeat: (data) => data.posts,  // Generate page for each post
      data: (globalData, post) => ({ // Data for each page
        ...globalData,
        post,
        title: `${post.title} - ${globalData.site.title}`
      })
    }
  ]
};
```

### Server Mode Configuration

```javascript
export default {
  type: 'server',                    // Express-like web application
  port: 3000,
  
  data: {                            // Global application data
    app: { name: 'My App' }
  },
  
  api: [                             // REST API endpoints
    {
      path: '/api/users',
      method: 'GET',
      handler: async (ctx, database) => {
        const users = database.collection('users');
        return ctx.respond.json({ users: users.all() });
      }
    }
  ],
  
  routes: [                          // Server-rendered pages
    {
      name: 'User Profile',
      path: '/user/:id',
      template: 'profile.html',
      data: async (ctx, database) => {
        const user = database.collection('users').get([ctx.params.id]);
        return { user, title: `${user.name}'s Profile` };
      }
    }
  ]
};
```

## Template Engines

Clovie supports multiple template engines:

### Nunjucks (Default - Jinja2-like)
```html
{% extends "layout.html" %}
{% block content %}
  <h1>{{ site.title }}</h1>
  {% for post in posts %}
    <article>{{ post.title }}</article>
  {% endfor %}
{% endblock %}
```

### Handlebars
```html
{{> header}}
<h1>{{site.title}}</h1>
{{#each posts}}
  <article>{{title}}</article>
{{/each}}
{{> footer}}
```

### Pug
```pug
extends layout
block content
  h1= site.title
  each post in posts
    article= post.title
```

## API Endpoints (Server Mode)

API endpoints receive a `ctx` (context) parameter:

```javascript
{
  path: '/api/posts/:id',
  method: 'GET',
  handler: async (ctx) => {
    const { id } = ctx.params;
    return ctx.respond.json({ id });
  }
}
```

### Context Object (`ctx`)
- `ctx.req` - HTTP request object
- `ctx.body` - Request body (parsed JSON/form data)
- `ctx.query` - URL query parameters
- `ctx.params` - Route parameters
- `ctx.respond.json(data, status)` - Send JSON response
- `ctx.respond.text(text, status)` - Send text response
- `ctx.respond.html(html, status)` - Send HTML response

## Development Commands

```bash
# Development server with live reload
npm run dev
# or
clovie dev

# Build for production
npm run build
# or
clovie build

# Start production server (server mode)
npm start
# or
clovie serve
```

## Common Development Patterns

### 1. Loading External Data
```javascript
export default {
  data: async () => {
    const posts = await fetch('https://api.example.com/posts')
      .then(r => r.json());
    
    return {
      site: { title: 'My Blog' },
      posts,
      categories: [...new Set(posts.map(p => p.category))]
    };
  }
};
```

### 2. Dynamic Route Generation
```javascript
routes: [
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
  }
]
```

### 3. API with Validation
```javascript
{
  path: '/api/posts',
  method: 'POST',
  handler: async (ctx) => {
    const { title, content } = ctx.body;
    
    if (!title || title.trim().length < 3) {
      return ctx.respond.json(
        { error: 'Title must be at least 3 characters' },
        400
      );
    }
    
    return ctx.respond.json({ success: true, title: title.trim(), content }, 201);
  }
}
```

### 4. Server-Side Rendering with Data
```javascript
{
  name: 'News Feed',
  path: '/news',
  template: 'news.html',
  data: async ({ context }) => {
    const response = await fetch('https://api.example.com/news');
    const articles = await response.json();
    return { articles, title: 'Latest News' };
  }
}
```

## File Watching & Live Reload

Clovie automatically watches for changes in:
- `views/` - Template files
- `partials/` - Partial components
- `scripts/` - JavaScript files
- `styles/` - SCSS/CSS files
- `assets/` - Static assets

Changes trigger automatic rebuilds and browser refresh.

## Asset Pipeline

- **Scripts**: Compiled with esbuild (or custom compiler)
- **Styles**: SCSS compilation with Sass
- **Assets**: Copied as-is to output directory
- **Templates**: Rendered with chosen template engine

## Error Handling

### API Errors
```javascript
// Return proper HTTP status codes
return ctx.respond.json({ error: 'Not found' }, 404);
return ctx.respond.json({ error: 'Invalid input' }, 400);
```

### Template Errors
```javascript
// Handle missing data gracefully in templates
{% if user %}
  <h1>{{ user.name }}</h1>
{% else %}
  <h1>Unknown User</h1>
{% endif %}
```

## Best Practices

1. **Use async data loading** for external APIs
2. **Validate input** in API endpoints
3. **Handle errors gracefully** with proper HTTP status codes
4. **Use semantic HTML** in templates
5. **Organize data logically** in the config file
6. **Test builds regularly** with `npm run build`

## Troubleshooting

### Common Issues
- **Port already in use**: `clovie kill --port 3000`
- **Template not found**: Check file paths in config
- **Build failures**: Check console output for detailed errors

### Debug Mode
Add `console.log()` statements in handlers and data functions to debug issues.

## Key Differences from Other Frameworks

- **No client-side routing** - Uses traditional server-side rendering
- **No build-time JavaScript** - Server handles all dynamic content
- **Template agnostic** - Choose your preferred template engine
- **Dual mode** - Same codebase can be static or server-rendered

This guide should help you understand and work with any Clovie project effectively.
