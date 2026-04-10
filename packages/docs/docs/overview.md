---
sidebar_position: 1
slug: /
title: Overview
description: Clovie — static sites and full-stack Node apps. Factories for API routes, configuration guide, and quick start.
---

# Clovie documentation

> **Vintage web dev tooling with modern quality of life**

Welcome to the documentation for Clovie — a Node.js framework that bridges static site generation and full-stack applications.

## What is Clovie?

Clovie is the "Hollow Knight of Web Dev" — simple but deep, easy to start but room to grow. It combines static site generation with full-stack capabilities through a service-oriented architecture built on `@jucie.io/engine`.

### Factories and server HTTP layers

Server projects should treat **`api`**, **`routes`**, **`middleware`**, and **`hooks`** as factory-aware configuration: use **`defineRoutes`** / **`defineApi`** (same function), **`defineMiddleware`**, and **`defineHooks`** from `clovie` when handlers need `useContext` or when splitting endpoints across modules. Plain objects and arrays still work; Clovie normalizes mixed arrays before registering routes. See [Configuration — Factories](./configuration/factories) and [API endpoints](./configuration/api-endpoints).

### AI assistants (Cursor and others)

The published `clovie` package includes **`.cursor/skills/clovie.mdc`**. Use **`clovie skills`** for usage, **`clovie skills path`** to locate the file inside `node_modules`, or **`clovie skills show`** to print it for copying into your project’s `.cursor/skills/`.

### Key features

- **Dual mode**: static site generation or full server applications
- **Zero config**: smart auto-detection of project structure
- **Fast builds**: incremental builds with caching
- **Template agnostic**: Handlebars, Nunjucks, Pug, Mustache, or custom engines
- **Asset pipeline**: SCSS and JavaScript bundling with esbuild
- **Live reload**: WebSocket-based reload in development
- **Dynamic routing**: data-driven pages and API endpoints

## Documentation map

- **[Configuration reference](./configuration)** — full `clovie.config.js` guide
- **[Main README](https://github.com/adrianjonmiller/clovie/blob/main/README.md)** — repo overview, installation, project structure

## Quick start

```bash
npx clovie create my-site
cd my-site && npm install && npm run dev
```

```bash
npx clovie create my-app --template server
cd my-app && npm install && npm run dev
```

## Examples and templates

- **[Examples](https://github.com/adrianjonmiller/clovie/tree/main/examples)** — sample configs (Handlebars, Nunjucks, server app, etc.)
- **[Templates](https://github.com/adrianjonmiller/clovie/tree/main/templates)** — `static` and `server` starters

## Architecture

Clovie uses a **service-oriented architecture** where functionality is provided by services extending `ServiceProvider` from `@jucie.io/engine` (File, Compile, Configurator, Run, Server, LiveReload, and more).

## License

Clovie is open source under the [MIT License](https://github.com/adrianjonmiller/clovie/blob/main/LICENSE).

## Links

- [GitHub](https://github.com/adrianjonmiller/clovie)
- [npm](https://www.npmjs.com/package/clovie)
