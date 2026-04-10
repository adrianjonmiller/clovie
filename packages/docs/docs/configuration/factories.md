---
sidebar_position: 8
title: Factories
description: Use defineRoutes, defineApi, defineMiddleware, and defineHooks to compose server layers from separate modules.
---

# Factories for api, routes, middleware, and hooks

Clovie registers server HTTP layers through **factory definitions** from `@jucie.io/engine-server` (re-exported from the `clovie` package). At runtime the `Run` service builds one ordered list and calls `server.use(...)` with:

1. **`hooks`** — `defineHooks(name, (useContext, opts) => hookObject)`
2. **`middleware`** — `defineMiddleware(name, (useContext, opts) => middlewareFns)` or plain Express-style functions
3. **`api`** — `defineRoutes` / `defineApi` (same function) plus raw route objects
4. **Generated routes** — `views/` and your **`routes`** array (also normalized through `defineRoutes`)

## Why factories matter

- **`useContext`** — resolve engine services (`log`, `file`, etc.) when the server starts, not at module top level.
- **Composition** — export `defineRoutes('billing', ...)` from `api/billing.js` and spread factories into `api: [...]`.
- **Mixed config** — `api` (and other keys) accept **raw objects**, **arrays of routes**, **single factories**, or **arrays mixing both**; `normalizeToFactories` batches raw items and preserves real factories.

## Imports

```javascript
import {
  defineApi,          // alias of defineRoutes — useful for api: []
  defineRoutes,
  defineMiddleware,
  defineHooks,
} from 'clovie';
```

## Example: API split across modules

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
