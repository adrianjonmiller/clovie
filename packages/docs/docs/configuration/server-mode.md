---
sidebar_position: 6
title: Server application mode
description: Build full Express.js applications with APIs, server-side rendering, and middleware using type server.
---

# Server Application Mode

Full Express.js applications with APIs and server-side rendering.

## Basic Server Configuration

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

## Server-specific topics

Server mode unlocks several additional configuration keys:

- **[Routes & Dynamic Pages](./routes)** — server-rendered pages with async `data` functions
- **[Factories](./factories)** — `defineRoutes`, `defineApi`, `defineMiddleware`, `defineHooks` for composable module-level definitions
- **[API Endpoints](./api-endpoints)** — REST-style handlers, the `ctx` context object, and full CRUD examples
- **[Middleware](./middleware)** — authentication, CORS, file uploads, and execution order

