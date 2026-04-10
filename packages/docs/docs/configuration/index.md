---
sidebar_position: 1
title: Configuration reference
description: Overview of clovie.config.js — the single file that controls everything from file paths to server routes.
---

# Clovie Configuration Guide

Complete reference for `clovie.config.js` configuration options.

## Minimal Setup (Zero Config)

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

## Configuration Object Structure

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

## What's in this section

- [File Paths & Structure](./file-paths) — configuring input/output directories
- [Data & State Management](./data-and-state) — static data, async loading, server state
- [Template Engines](./template-engines) — Handlebars, Nunjucks, Pug, and custom engines
- [Static Mode](./static-mode) — blogs, documentation, and marketing sites
- [Server Mode](./server-mode) — full Express.js applications
- [Routes & Dynamic Pages](./routes) — generating pages from data
- [Factories](./factories) — `defineRoutes`, `defineApi`, `defineMiddleware`, `defineHooks`
- [API Endpoints](./api-endpoints) — REST-style handlers and the `ctx` context object
- [Middleware](./middleware) — auth, CORS, file uploads, and execution order
- [Build & Development](./build-and-dev) — minification, sitemap, hot reload, and environment config
