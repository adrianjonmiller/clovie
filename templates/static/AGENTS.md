# AGENTS — Clovie Static Site Project

This is a Clovie static site (`type: 'static'`). Clovie generates static HTML files from templates and data defined in `clovie.config.js`.

## Project structure

```
project/
├── clovie.config.js    # All site behavior: data, routes, render engine
├── package.json
├── views/              # HTML templates (Nunjucks by default)
├── partials/           # Reusable template components
├── scripts/            # Client-side JavaScript (bundled with esbuild)
├── styles/             # SCSS/CSS stylesheets
├── assets/             # Static files (images, fonts, etc.)
└── dist/               # Built output (generated)
```

## Key concepts

- **`clovie.config.js`** drives everything: `data` for global template variables, `routes` for dynamic page generation, `renderEngine` for the template engine.
- **Views** in `views/` are compiled to HTML with the template data. Each `.html` file becomes a page.
- **Routes** with `repeat` generate multiple pages from data (e.g. one page per blog post).
- **Partials** are registered by filename (e.g. `partials/header.html` becomes `header`).

## Commands

```bash
npm run dev     # development server with live reload
npm run build   # production build to dist/
```

## Full Clovie reference

For the complete API (ctx object, factories, hooks, middleware, CLI), see `node_modules/clovie/AGENTS.md` or run `clovie skills show` to get the bundled Cursor skill.
