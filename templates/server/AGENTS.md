# AGENTS — Clovie Server Project

This is a Clovie server application (`type: 'server'`). Clovie runs an HTTP server with API endpoints, server-rendered pages, and optional middleware, all defined in `clovie.config.js`.

## Project structure

```
project/
├── clovie.config.js    # All app behavior: api, routes, hooks, middleware
├── package.json
├── views/              # Server-rendered HTML templates (Nunjucks by default)
├── partials/           # Reusable template components
├── scripts/            # Client-side JavaScript (bundled with esbuild)
├── styles/             # SCSS/CSS stylesheets
├── assets/             # Static files (images, fonts, etc.)
└── dist/               # Built assets (generated)
```

## Key concepts

- **`clovie.config.js`** drives everything: `api` for JSON endpoints, `routes` for SSR pages, `hooks` and `middleware` for request lifecycle.
- **API routes** use `{ method, path, handler }` where `handler` receives `ctx` and returns via `ctx.respond.json()`, `.html()`, `.text()`, or `.file()`.
- **SSR routes** pair a `path` with a `template` and an async `data` function that returns template variables.
- **Factories** (`defineApi`, `defineRoutes`, `defineMiddleware`, `defineHooks` from `'clovie'`) let handlers access engine services via `useContext`. You can mix raw objects and factories in the same config array.
- Registration order: **hooks -> middleware -> api -> view routes + routes**.

## Commands

```bash
npm run dev     # development server with live reload
npm run build   # build assets
npm start       # production server
```

## Full Clovie reference

For the complete API (ctx object, factories, hooks, middleware, CLI), see `node_modules/clovie/AGENTS.md` or run `clovie skills show` to get the bundled Cursor skill.
