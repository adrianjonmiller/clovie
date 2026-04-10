# Clovie documentation (Docusaurus)

This is the **Docusaurus** site for Clovie: a marketing-style [landing page](src/pages/index.tsx) at `/` and docs under `/docs/`.

## Commands

```bash
npm install
npm start          # dev server (uses baseUrl / for local routing)
npm run build      # static output → build/ (baseUrl /clovie/ for GitHub Pages)
npm run serve      # preview production build
```

## Content

| File | Source |
|------|--------|
| `docs/overview.md` | Written for Docusaurus (docs home, `slug: /`) |
| `docs/configuration.md` | Copy of repo `docs/CONFIGURATION.md` + front matter; update both when editing the guide |
| `docs/contributing-docs.md` | How to work on this site |

## Deploy notes

- **GitHub Pages (project repo)** defaults: `url` + `baseUrl: '/clovie/'` in `docusaurus.config.ts`.
- **Root domain or Vercel/Netlify at `/`**: set `baseUrl: '/'` and the correct `url` in `docusaurus.config.ts`, or override at build time (see [Docusaurus deployment](https://docusaurus.io/docs/deployment)).

## Legacy docs

The previous static site built with Clovie lives in the parent [`docs/`](../docs/) directory.
