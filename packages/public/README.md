# Clovie Documentation

> **Vintage web dev tooling with modern quality of life**

The **published documentation site** is built with [Docusaurus](https://docusaurus.io/) in [`website/`](../website/). Run `npm run website:dev` from the repo root. This folder still contains the markdown source **`CONFIGURATION.md`** (copied into `website/docs/configuration.md` when updating the site) and a **legacy** Clovie static build (`clovie.config.js`, `views/`).

Welcome to the official documentation for Clovie - a powerful Node.js framework that bridges the gap between simple static sites and complex web applications.

## 🚀 What is Clovie?

Clovie is the "Hollow Knight of Web Dev" - simple but deep, easy to start but room to grow. It combines the best of static site generation with full-stack web application capabilities, all through a service-oriented architecture built on @jucie.io/engine.

### Factories and server HTTP layers

Server projects should treat **`api`**, **`routes`**, **`middleware`**, and **`hooks`** as factory-aware configuration: use **`defineRoutes`** / **`defineApi`** (same function), **`defineMiddleware`**, and **`defineHooks`** from `clovie` when handlers need `useContext` or when splitting endpoints across modules. Plain objects and arrays still work; Clovie normalizes mixed arrays before registering routes. Full detail: [Configuration guide — Factories](./CONFIGURATION.md#factories-for-api-routes-middleware-and-hooks) and [API Endpoints](./CONFIGURATION.md#api-endpoints).

### AI assistants (Cursor and others)

The published `clovie` package includes **`.cursor/skills/clovie.mdc`**. Use **`clovie skills`** for usage, **`clovie skills path`** to locate the file inside `node_modules`, or **`clovie skills show`** to print it for copying into your project’s `.cursor/skills/`.

### Key Features

- **🎯 Dual Mode**: Static site generation OR full Express server applications
- **🔄 Zero Config**: Smart auto-detection of project structure
- **⚡ Fast Builds**: Incremental builds with intelligent caching
- **🎨 Template Agnostic**: Handlebars, Nunjucks, Pug, Mustache, or custom engines
- **📦 Asset Pipeline**: SCSS compilation, JavaScript bundling with esbuild
- **🔄 Live Reload**: WebSocket-based live reload during development
- **🛣️ Dynamic Routing**: Data-driven page generation and API endpoints

## 📚 Documentation Overview

### Getting Started
- **[Quick Start](../README.md#quick-start)** - Get up and running in minutes
- **[Installation](../README.md#installation--usage)** - Installation options and project creation
- **[Project Structure](../README.md#project-structure)** - Understanding Clovie projects

### Configuration
- **[Configuration Guide](./CONFIGURATION.md)** - Comprehensive configuration reference
- **[Static Site Mode](./CONFIGURATION.md#static-site-mode)** - Perfect for blogs, docs, marketing sites
- **[Server Application Mode](./CONFIGURATION.md#server-application-mode)** - Full Express.js applications
- **[Template Engines](./CONFIGURATION.md#template-engines)** - Handlebars, Nunjucks, Pug, and more

### Examples & Templates
- **[Configuration Examples](../examples/)** - Real-world configuration examples
  - [Handlebars Blog](../examples/handlebars.config.js) - Blog with Handlebars templating
  - [Nunjucks Portfolio](../examples/nunjucks.config.js) - Portfolio site with Nunjucks
  - [Pug Documentation](../examples/pug.config.js) - Documentation site with Pug
  - [Mustache Blog](../examples/mustache.config.js) - Minimalist blog with Mustache
  - [Server Application](../examples/server-app.config.js) - Full-stack task manager API
- **[Project Templates](../templates/)** - Starter templates for new projects
  - [Default Template](../templates/default/) - Basic template with auto-detection
  - [Static Site](../templates/static/) - Optimized for static site generation
  - [Server App](../templates/server/) - Full Express.js application template

### Advanced Topics
- **[API Development](./CONFIGURATION.md#api-endpoints)** - Building REST APIs with Clovie
- **[Middleware](./CONFIGURATION.md#middleware)** - Express middleware configuration and authentication patterns
- **[Apps Integration](./CONFIGURATION.md#apps-integration)** - Bundled app orchestration (Vite, Webpack, Rollup, esbuild)
- **[Dynamic Routing](./CONFIGURATION.md#routes--dynamic-pages)** - Data-driven page generation
- **[Performance](../README.md#performance-features)** - Optimization and best practices

## 🏃 Quick Examples

### Static Blog (5 minutes)
```bash
# Create static blog
npx clovie create my-blog --template static
cd my-blog && npm install && npm run dev
```

### Server Application (5 minutes)
```bash
# Create server app
npx clovie create my-app --template server  
cd my-app && npm install && npm run dev
```

### Custom Configuration
```javascript
// clovie.config.js
export default {
  type: 'static', // or 'server'
  
  data: {
    site: {
      title: 'My Site',
      description: 'Built with Clovie'
    }
  },
  
  // Generate pages from data
  routes: [{
    path: '/posts/:slug',
    template: 'post.html',
    repeat: (data) => data.posts,
    data: (globalData, post) => ({ ...globalData, post })
  }]
};
```

## 🛠️ Architecture

Clovie uses a **service-oriented architecture** where all functionality is provided by services that extend `ServiceProvider` from @jucie.io/engine:

- **🗂️ File Service** - File operations with intelligent watching
- **⚙️ Compile Service** - Asset compilation with progress tracking
- **📝 Configurator Service** - Configuration management with hot-reloading
- **🏃 Run Service** - Build orchestration and task execution
- **🌐 Server Service** - Express server with kernel-based request handling
- **🔄 LiveReload Service** - Development live-reload with WebSocket
- **🛣️ Router Service** - Route processing for static and dynamic content
- **💾 Cache Service** - Smart caching for incremental builds

## 🎯 Use Cases

### Static Sites (type: 'static')
Perfect for:
- **Blogs & Documentation** - Fast, SEO-friendly content sites
- **Marketing Sites** - Landing pages, portfolios, company sites
- **JAMstack Applications** - API-driven static sites
- **GitHub Pages** - Easy deployment to static hosting

### Server Applications (type: 'server')
Perfect for:
- **Web Applications** - Dashboard, admin panels, user interfaces
- **REST APIs** - Backend services
- **Full-Stack Apps** - Combined frontend and backend
- **Real-time Applications** - WebSocket support for live features

## 🧪 This Documentation Site

This documentation site is built with Clovie itself! It demonstrates:

- **Static site generation** for fast loading
- **Handlebars templating** for clean, maintainable templates
- **Automatic deployment** with GitHub Actions
- **SEO optimization** with proper meta tags and structure

You can view the [source configuration](./clovie.config.js) to see how it's built.

## 🤝 Contributing

We welcome contributions to Clovie! Here's how you can help:

### Documentation
- Improve existing documentation
- Add examples and tutorials
- Fix typos and clarify explanations

### Code
- Bug fixes and improvements
- New features and enhancements
- Performance optimizations

### Community
- Share your Clovie projects
- Help others in discussions
- Report issues and provide feedback

## 📄 License

Clovie is open source software licensed under the [MIT License](../LICENSE).

## 🔗 Links

- **[GitHub Repository](https://github.com/adrianjonmiller/clovie)** - Source code and issues
- **[npm Package](https://www.npmjs.com/package/clovie)** - Package information
- **[Examples](../examples/)** - Configuration examples
- **[Templates](../templates/)** - Project starter templates

---

**Built with ❤️ by [Adrian Miller](https://github.com/adrianjonmiller)**

*Clovie: Making web development feel like the good old days, but better.*