# AGENTS — Clovie

Instructions for AI agents working with or on Clovie.

## Part A: Using Clovie in your project

Clovie is a Node.js static site generator and server framework driven by a single `clovie.config.js` file, built on the `@jucie.io/engine` service architecture.

### Two modes

- **`type: 'static'`** — generates static HTML under `outputDir`; dev server is for preview and live reload.
- **`type: 'server'`** — HTTP server registers factories in order: `hooks` -> `middleware` -> `api` -> view routes + `routes`.

### Imports

```javascript
import {
  createClovie,
  defineApi,        // alias for defineRoutes; use for semantic clarity on api: []
  defineRoutes,
  defineMiddleware,
  defineHooks,
} from 'clovie';
```

`defineApi` and `defineRoutes` are the same function.

### API route shape

Routes in the `api` array must use `method`, `path`, and `handler`:

```javascript
{
  method: 'GET',
  path: '/api/status',
  handler: (ctx) => ctx.respond.json({ status: 'ok' })
}
```

Response methods on `ctx.respond`: `.json(data, status)`, `.html(html, status)`, `.text(text, status)`, `.file(path, status)`.

Request data: `ctx.body` (parsed body), `ctx.query` (query params), `ctx.params` (route params), `ctx.req` (raw request).

### Factories

`api`, `routes`, `middleware`, and `hooks` accept plain objects/arrays **or** `define*` factory functions. Factories receive `(useContext, opts)` and are invoked lazily when the server registers routes, not at import time.

```javascript
import { defineRoutes } from 'clovie';

const adminApi = defineRoutes('admin', (useContext, opts) => {
  const [log] = useContext('log');
  return [
    { method: 'GET', path: '/ping', handler: (ctx) => ctx.respond.json({ ok: true }) },
  ];
});

export default {
  type: 'server',
  api: [adminApi],
};
```

You can mix raw route objects and factories in the same array.

### CLI commands

```
clovie create <name> [--template static|server]
clovie dev          # development server with live reload
clovie build        # production build
clovie serve        # production server
clovie kill --port 3000
clovie skills show  # dump bundled Cursor skill for pasting
```

### Common mistakes

- Using `action` instead of **`handler`** on API routes.
- Omitting **`type: 'server'`** when using `api` or server routes.
- Assuming factories run at import time — they run when the server starts.

### Cursor skill

Clovie ships a Cursor skill at `.cursor/skills/clovie.mdc`. Run `clovie skills show` to print it, or copy it into your project's `.cursor/skills/`.

---

## Part B: Contributing to the Clovie source

### Repository layout

```
clovie/
├── lib/                 # Core source code
│   ├── services/        # ServiceProvider implementations
│   ├── factories/       # defineApi, defineRoutes, defineMiddleware, defineHooks
│   ├── utils/           # Shared utilities
│   ├── cli/             # CLI subcommands (e.g. skillsCommand.js)
│   ├── createClovie.js  # Engine factory — wires all services
│   └── main.js          # Package exports
├── bin/                 # CLI entry point
│   └── cli.js
├── __tests__/           # Vitest test suite
├── config/              # Default clovie.config.js fallback
├── templates/           # Project templates (static, server)
├── scripts/             # Build and publish scripts
├── packages/            # Workspaces
│   ├── docs/            # @clovie/docs — Docusaurus documentation site
│   └── public/          # @clovie/public — Clovie-built static site
├── __dev__/             # Development playground (server mode)
└── .cursor/skills/      # Bundled Cursor skill (ships with npm)
```

### Module format

ESM only (`"type": "module"` in package.json). Use `import`/`export` everywhere. Use `import.meta.url` instead of `__dirname`.

### Service architecture

All services extend `ServiceProvider` from `@jucie.io/engine`. Each service declares:

```javascript
import { ServiceProvider } from '@jucie.io/engine';

export class MyService extends ServiceProvider {
  static manifest = {
    name: 'Human Readable Name',
    namespace: 'camelCaseKey',       // becomes the engine accessor (clovie.camelCaseKey)
    version: '1.0.0',
    dependencies: [OtherService],    // installed before this service
  };

  // Optional — runs once during install
  async initialize(_, config) { }

  // Optional — reactive read-only properties
  getters() {
    return { prop: () => this.#value };
  }

  // Required — public API exposed on the engine
  actions(useContext) {
    const [file, log] = useContext('file', 'log');
    return {
      doSomething: async (opts) => { /* ... */ },
    };
  }
}
```

**`useContext` idioms:**
- Positional: `const [file, log] = useContext('file', 'log');` — resolves at action-construction time.
- Whole context: `const { cache } = useContext();` — returns the full context object.
- Late-bound: `this.inject('server')` inside async methods for services that may not be installed yet.

Use `#private` fields for internal state.

### Engine wiring (`createClovie`)

`createClovie({ optsPath, mode })` builds the engine in this order:

1. `Configurator` — loads and watches `clovie.config.js`
2. On `configurator.onReady(opts)`:
   - `Compile` and `Run` (always)
   - `EsBuild` (if `opts.scripts` exists)
   - User `opts.setup(clovie)` hook
   - `Server` (if `type: 'server'` or development mode)
   - `LiveReload` (if development mode)
   - User `opts.services` array

The resolved value is the engine instance, not a running server. The CLI calls `clovie.run.build()`, `.serve()`, or `.dev()` to execute.

### Testing

- **Framework:** Vitest with `globals: true`.
- **Test files:** `__tests__/*.test.js`
- **Fixture configs:** `__tests__/clovie.<area>.config.js` (e.g. `clovie.middleware.config.js`)
- **Integration pattern:**

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClovie } from '../lib/createClovie.js';
import path from 'path';

const pause = async (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));

describe('Feature', () => {
  let clovie = null;

  beforeEach(async () => {
    clovie = await createClovie({
      optsPath: path.resolve(process.cwd(), '__tests__', 'clovie.config.js'),
      mode: 'production',
      open: false,
    });
    await pause(50);
  });

  afterEach(async () => {
    if (clovie?.server?.isRunning()) {
      await clovie.server.stop();
    }
    clovie = null;
  });

  it('should work', async () => {
    expect(clovie.configurator.opts.type).toBe('static');
  });
});
```

- Use `port: 0` for dynamic port allocation in HTTP tests.
- CLI tests use `child_process.spawn` with a `runCli` helper.

### CLI structure (`bin/cli.js`)

Command branching order: `skills` -> `kill` -> `create` -> `command-line-args` main flow.

Main commands: `build` (production, exits after), `serve` (production, stays alive), `dev`/`watch` (development, stays alive).

Legacy aliases: `watch` -> `dev`, `server` -> `serve`.

Config resolution: dynamic `import(optsPath)`, fallback to `config/clovie.config.js`.

### Templates

`templates/static/` and `templates/server/` are copied verbatim by `clovie create`. The placeholders `{{projectName}}` and `{{clovieVersion}}` are substituted at copy time. Keep these placeholders intact when editing template files.

### Workspaces

- **`@clovie/docs`** — Docusaurus 3 site, content in `packages/docs/docs/`
- **`@clovie/public`** — Clovie static site (marketing/legacy docs surface)

Root scripts: `npm run docs:dev`, `npm run docs:build`, `npm run public:dev`, `npm run public:build`.

### Publishing

`prepublishOnly` runs `npm test` — regressions block publish. Use `scripts/publish.js` for version bumps and releases. The package ships raw source (no build step for the library itself).
