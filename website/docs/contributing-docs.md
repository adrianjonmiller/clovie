---
sidebar_position: 3
title: Contributing to docs
description: How to run and build this Docusaurus site locally.
---

# Contributing to documentation

This site uses [Docusaurus](https://docusaurus.io/). Markdown sources live in `website/docs/` (synced from the main `docs/` folder in the repo where noted).

## Prerequisites

- Node.js 18+

## Commands

From the repository root:

```bash
npm run website:start    # dev server (default http://localhost:3000)
npm run website:build    # production build → website/build/
```

Or from `website/`:

```bash
npm install
npm start
npm run build
```

## Editing content

- **Overview** — `website/docs/overview.md` (also the docs home at `/docs/`)
- **Configuration** — `website/docs/configuration.md` (copy of `docs/CONFIGURATION.md`; update both or add a sync script later)

After changing `docs/CONFIGURATION.md` in the repo root, copy it into `website/docs/configuration.md` and re-add the YAML front matter at the top if the copy overwrote it.

## Legacy Clovie-built docs

The original documentation site built with Clovie remains under `docs/` (`clovie.config.js`, `views/`, etc.). You can keep it for reference or remove it once Docusaurus is the single source for the public site.
