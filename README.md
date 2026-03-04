# Clovie - Vintage Web Dev Tooling with Modern QoL

> *"The Hollow Knight of Web Dev"* - Simple but deep, easy to start but room to grow.

A powerful Node.js-based **static site generator** and **full-stack web framework** that bridges the gap between simple static sites and complex web applications. Built on the **@jucie.io/engine** service architecture for maximum flexibility and maintainability.

## 🚀 Quick Start

```bash
# Create a new project
npx clovie create my-site

# Start development
cd my-site
npm install
npm run dev
```

## ✨ Key Features

- **🎯 Dual Mode**: Static site generation OR full Express server applications
- **🔄 Zero Config**: Smart auto-detection of project structure
- **⚡ Fast Builds**: Incremental builds with intelligent caching
- **🎨 Template Agnostic**: Handlebars, Nunjucks, Pug, Mustache, or custom engines
- **📦 Asset Pipeline**: SCSS compilation, JavaScript bundling with esbuild
- **🔄 Live Reload**: WebSocket-based live reload during development
- **🛣️ Dynamic Routing**: Data-driven page generation and API endpoints
- **🧩 App Orchestration**: Build and serve external Vite/Webpack/Rollup/esbuild apps via kernel handlers
- **🔧 Service Architecture**: Modular, extensible service-oriented design

## 🏗️ Architecture Overview

Clovie uses a **service-oriented architecture** built on `@jucie.io/engine`. All functionality is provided by services that extend `ServiceProvider`, orchestrated through dependency injection with reactive state management.

### Core Services

- **🗂️ File** - File system operations with intelligent watching
- **⚙️ Compile** - Asset compilation with progress tracking
- **📝 Configurator** - Configuration management with hot-reloading
- **🏃 Run** - Build orchestration and task execution  
- **🌐 Server** - Express server with kernel-based request handling
- **🔄 LiveReload** - Development live-reload with WebSocket
- **🛣️ Router** - Route processing for both static and dynamic content
- **💾 Cache** - Smart caching for incremental builds

### Operating Modes

**🗂️ Static Mode (`type: 'static'`)**:
- Generates optimized static HTML files
- Perfect for blogs, documentation, marketing sites
- Uses development server only for live reload
- Deployable to any static hosting (Netlify, Vercel, GitHub Pages)

**🌐 Server Mode (`type: 'server'`)**:
- Full Express.js web application
- API endpoints with state management
- Server-side rendering with dynamic routes  
- Database integration and real-time features
- Perfect for web apps, dashboards, APIs

## Project Structure

```
clovie/
├── __tests__/              # Test files
├── bin/                    # CLI executable
│   └── cli.js             # Command line interface
├── config/                # Configuration files  
│   └── clovie.config.js   # Default configuration
├── lib/                   # Source code - Service-based architecture
│   ├── createClovie.js    # Engine factory function
│   ├── Build.js           # Build service
│   ├── Cache.js           # Caching service
│   ├── Compiler.js        # Template compilation service
│   ├── File.js            # File system service
│   ├── Routes.js          # Routing service  
│   ├── Server.js          # Express server service
│   ├── Views.js           # View processing service
│   └── utils/             # Utility functions
│       ├── clean.js       # Directory cleaning
│       ├── discover.js    # Auto-discovery
│       └── liveReloadScript.js # Live reload
├── templates/             # Project templates
└── examples/              # Configuration examples
```

## Service Architecture

Each service in Clovie extends `ServiceProvider` and defines:

- **Static manifest**: Name, namespace, version, and dependencies
- **initialize()**: Setup phase with access to config and context
- **actions()**: Methods exposed through the engine context

### Service Dependencies

Services declare their dependencies in their manifest:

```javascript
static manifest = {
  name: 'Clovie Build',
  namespace: 'build', 
  version: '1.0.0',
  dependencies: [Cache, Routes]  // Initialized first
};
```

### State Management

The engine provides two state stores:

- **`state`**: Reactive store for build-time data (from config.data)
- **`stable`**: Persistent storage (cache, build stats, etc.)

Services access these via `useContext()`:

```javascript
actions(useContext) {
  const { state, stable, file, compiler } = useContext();
  // Service methods can access other services and state
}
```

## Core Features

- **Template Engine Agnostic**: Support for Handlebars, Nunjucks, Pug, Mustache, or custom engines
- **Asset Processing**: JavaScript bundling with esbuild, SCSS compilation, static asset copying  
- **Development Server**: Live reload with Express and file watching
- **Dynamic Routing**: Powerful route system for both static and server-side page generation
- **Server-Side Rendering**: Full Express applications with dynamic routes and API endpoints
- **Incremental Builds**: Smart caching for faster rebuilds
- **Auto-Discovery**: Intelligent project structure detection

## 📦 Installation & Usage

### Creating New Projects

#### Quick Start with Templates
```bash
# Static site (blogs, docs, marketing)
npx clovie create my-blog --template static

# Server application (APIs, web apps)
npx clovie create my-app --template server

# Default (auto-detected)
npx clovie create my-site
```

#### Manual Installation
```bash
# Install in existing project
npm install --save-dev clovie

# Or globally
npm install -g clovie
```

### Development Workflow

#### 🗂️ Static Site Development
```bash
# Start development server with live reload
npm run dev
# or
clovie dev

# Build optimized static files
npm run build  
# or
clovie build

# Preview production build
clovie serve --static
```

#### 🌐 Server Application Development
```bash
# Start development server with live reload
npm run dev
# or  
clovie dev

# Start production server
npm start
# or
clovie serve

# Build assets only (server handles routing)
clovie build
```

## ⚙️ Configuration

### Zero Config Start

Clovie uses **smart auto-detection** - just create your files and start:

```javascript
// clovie.config.js (minimal)
export default {
  data: {
    title: 'My Site',
    description: 'Built with Clovie'
  }
};
```

Automatically detects:
- `views/` → HTML templates
- `scripts/main.js` → JavaScript entry  
- `styles/main.scss` → SCSS entry
- `assets/` → Static assets
- `partials/` → Reusable components

### 🗂️ Static Site Configuration

Perfect for blogs, documentation, and marketing sites:

```javascript
export default {
  type: 'static', // Generate static HTML files
  
  // Data available in all templates
  data: {
    site: {
      title: 'My Blog',
      url: 'https://myblog.com',
      description: 'A fast static blog'
    },
    nav: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
      { title: 'Blog', url: '/blog' }
    ]
  },
  
  // Template engine (auto-detected from usage)
  renderEngine: 'handlebars', // or nunjucks, pug, custom function
  
  // Dynamic pages from data
  routes: [{
    name: 'Blog Posts',
    path: '/posts/:slug',
    template: 'post.html',
    repeat: (data) => data.posts, // Generate page for each post
    data: (globalData, post) => ({
      ...globalData,
      post,
      title: `${post.title} - ${globalData.site.title}`
    })
  }],
  
  // Build optimizations
  minify: true,
  generateSitemap: true
};
```

### 🌐 Server Application Configuration

Full-stack web applications with APIs and dynamic content:

```javascript
import express from 'express';

export default {
  type: 'server', // Express application mode
  port: 3000,
  
  // Shared data and configuration
  data: {
    app: {
      name: 'My App',
      version: '1.0.0'
    }
  },
  
  // Express middleware (auto-selects Express adapter)
  middleware: [
    express.json(),
    express.urlencoded({ extended: true }),
    
    // Authentication middleware for protected routes
    (req, res, next) => {
      if (req.url.startsWith('/api/protected/')) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        // Verify token and attach user to request
        req.user = verifyJWT(token);
      }
      next();
    }
  ],
  
  // API endpoints
  api: [
    {
      path: '/api/users',
      method: 'GET',
      action: async (state, event) => {
        const users = await state.db.query('SELECT * FROM users');
        return { users, total: users.length };
      }
    },
    {
      path: '/api/users',
      method: 'POST', 
      action: async (state, event) => {
        const { name, email } = event.body;
        const user = await state.db.insert('users', { name, email });
        return { success: true, user };
      }
    },
    {
      path: '/api/users/:id',
      method: 'GET',
      action: async (state, event) => {
        const user = await state.db.findById('users', event.params.id);
        return user ? { user } : { error: 'User not found', status: 404 };
      }
    }
  ],
  
  // Server-rendered routes
  routes: [
    {
      name: 'User Dashboard',
      path: '/dashboard/:userId',
      template: 'dashboard.html',
      data: async (state, params) => {
        const user = await state.db.findById('users', params.userId);
        const stats = await getUserStats(params.userId);
        return { user, stats, title: `Dashboard - ${user.name}` };
      }
    }
  ]
};
```

## 🚀 Advanced Features

### 🔐 Middleware & Authentication

Clovie supports Express middleware for server applications. When you configure middleware, Clovie automatically uses the Express adapter for full compatibility.

**Common Authentication Pattern:**
```javascript
export default {
  type: 'server',
  
  middleware: [
    // Request logging
    (req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    },
    
    // Selective authentication
    (req, res, next) => {
      // Public routes
      const publicPaths = ['/api/login', '/api/health'];
      if (publicPaths.some(path => req.url.startsWith(path))) {
        return next();
      }
      
      // Protect /api/protected/* routes
      if (req.url.startsWith('/api/protected/')) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Token required' });
        }
        try {
          req.user = verifyJWT(token);
          next();
        } catch (error) {
          res.status(401).json({ error: 'Invalid token' });
        }
      } else {
        next();
      }
    }
  ]
};
```

**Test Authentication:**
```bash
# Public endpoint
curl http://localhost:3000/api/health

# Protected endpoint (fails)
curl http://localhost:3000/api/protected/data

# Protected endpoint (works)  
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/protected/data
```

### 🧩 App Orchestration

Clovie can manage multiple frontend apps alongside your core project using kernel-level handlers, so no Express-specific middleware is required. Define apps in `clovie.config.js`, and Clovie will:

- Detect the build tool (Vite, Webpack, Rollup, esbuild) or use the specified `buildTool`
- Run builds during `clovie build` and `clovie serve`
- Launch tool-specific dev middleware during `clovie dev`
- Mount bundles or dev servers at configurable mount paths (e.g., `/admin`, `/studio`)

```javascript
export default {
  type: 'server',
  apps: [
    {
      name: 'studio',
      source: './apps/studio',
      buildTool: 'vite',
      buildOptions: {
        watch: true,
        build: { outDir: './apps/studio/dist' }
      },
      dev: {
        mountPath: '/studio'
      }
    }
  ]
};
```

See [Apps Integration](docs/CONFIGURATION.md#apps-integration) for full examples covering Webpack, Rollup, and esbuild setups.

### 🔄 Async Data Loading

Load data dynamically at build time or runtime:

```javascript
export default {
  // Static: Load data at build time
  data: async () => {
    const posts = await fetch('https://api.example.com/posts').then(r => r.json());
    const authors = await loadAuthorsFromFile('./data/authors.json');
    
    return {
      site: { title: 'My Blog' },
      posts,
      authors,
      buildTime: new Date().toISOString()
    };
  },
  
  // Server: Load data per request
  routes: [{
    path: '/posts/:slug',
    template: 'post.html',
    data: async (state, params) => {
      const post = await fetchPostBySlug(params.slug);
      const comments = await fetchComments(post.id);
      return { post, comments };
    }
  }]
};
```

### 🎯 Dynamic Route Generation

Generate pages from data with powerful routing:

```javascript
export default {
  data: {
    posts: [
      { id: 1, title: 'Getting Started', slug: 'getting-started', category: 'tutorial' },
      { id: 2, title: 'Advanced Usage', slug: 'advanced-usage', category: 'guide' }
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
      data: (globalData, post) => ({ ...globalData, post })
    },
    
    // Category pages
    {
      name: 'Category Pages', 
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

### 🎨 Template Engine Support

Use any template engine or create custom ones:

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

// Custom engine
export default {
  renderEngine: (template, data) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
};
```

### 🛠️ CLI Commands

Clovie includes powerful CLI tools for development and deployment:

```bash
# Project creation
clovie create <name>                    # Creates static site (default)
clovie create <name> --template server  # Creates server application

# Development
clovie dev              # Start development server with live reload
clovie watch            # Alias for dev

# Building  
clovie build            # Build for production
clovie serve            # Start production server

# Utilities
clovie kill --port 3000         # Kill process on port 3000
clovie kill --common            # Kill processes on common dev ports
clovie kill --check             # Check which ports are in use
```

### 📁 Project Structure

When you create a new project, you get a clean, organized structure:

```
my-site/
├── clovie.config.js    # Configuration file
├── package.json        # Dependencies and scripts
├── views/              # HTML templates
│   ├── index.html     # Homepage
│   └── about.html     # Additional pages
├── partials/           # Reusable components (optional)
│   ├── header.html    # Site header
│   └── footer.html    # Site footer  
├── scripts/            # JavaScript
│   └── main.js        # Main JS entry point
├── styles/             # SCSS/CSS
│   └── main.scss      # Main stylesheet
├── assets/             # Static files
│   └── images/        # Images, fonts, etc.
└── dist/               # Build output (generated)
```

### 🚀 Performance Features

- **⚡ Incremental Builds**: Only rebuilds changed files
- **📦 Smart Caching**: Content-based cache invalidation  
- **🔄 Live Reload**: WebSocket-based for instant updates
- **📊 Progress Tracking**: Real-time build progress
- **🗜️ Asset Optimization**: Minification and optimization
- **🌐 Static + Server**: Best of both worlds

## 💡 Best Practices & Tips

### 🎯 Development Best Practices

**Static Sites:**
- Use `partials/` for reusable components (header, footer, nav)
- Organize data in the config file or external JSON files
- Use semantic HTML and meaningful route paths for SEO
- Test builds regularly with `npm run build`

**Server Applications:**
- Validate input data in API actions
- Use middleware for authentication and request parsing
- Handle errors gracefully in API endpoints
- Implement proper data migrations and seeding

### 🔧 Configuration Tips

```javascript
export default {
  // Environment-specific config
  ...(process.env.NODE_ENV === 'production' && {
    baseUrl: 'https://mysite.com',
    minify: true
  }),
  
  // Async data with error handling
  data: async () => {
    try {
      const posts = await fetchPosts();
      return { posts, lastUpdated: Date.now() };
    } catch (error) {
      console.warn('Failed to fetch posts:', error);
      return { posts: [], lastUpdated: Date.now() };
    }
  }
};
```

### 📊 Performance Optimization

- **Use incremental builds**: Clovie's caching handles this automatically
- **Optimize images**: Place optimized images in `assets/`
- **Minimize JavaScript**: Use esbuild's built-in minification
- **Cache API responses**: Implement caching in server mode API actions
- **Static generation**: Use static mode for content that doesn't change often

### 🔄 Development Workflow

```bash
# Recommended development flow
npm run dev          # Start with live reload
# Edit files and see changes instantly
npm run build        # Test production build
npm run serve        # Test production serving (server mode)
```

## 🛠️ Development & Contributing

```bash
# Clone repository
git clone https://github.com/adrianjonmiller/clovie.git
cd clovie

# Install dependencies
npm install

# Run tests  
npm test
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Build package
npm run build

# Test with example projects
npm run dev           # Uses __dev__ example
```

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**  
```bash
clovie kill --port 3000     # Kill specific port
clovie kill --common        # Kill common dev ports  
clovie kill --check         # Check port status
```

**Build Errors**
- Check that all file paths in config exist
- Verify template syntax matches your render engine
- Ensure async data functions handle errors properly
- Check console output for detailed error messages

**Template Not Found**
- Verify the `views` directory path in your config
- Check that template files have correct extensions
- Ensure partial files are in the `partials` directory

**Live Reload Not Working**
- Check that you're in development mode (`npm run dev`)
- Verify WebSocket connection in browser dev tools
- Try refreshing the page manually

### Getting Help

- 📚 [Documentation](https://github.com/adrianjonmiller/clovie)
- 🐛 [Issue Tracker](https://github.com/adrianjonmiller/clovie/issues)  
- 💬 [Discussions](https://github.com/adrianjonmiller/clovie/discussions)

## 📄 License

MIT - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by [Adrian Miller](https://github.com/adrianjonmiller)**

*Clovie: Vintage web dev tooling with modern quality of life.*
