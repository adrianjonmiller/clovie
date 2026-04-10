---
sidebar_position: 2
title: File paths & structure
description: Configure input and output directories for views, scripts, styles, assets, and partials.
---

# File Paths & Structure

## Path Configuration

```javascript
export default {
  // Input directories
  views: './src/templates',      // HTML templates
  scripts: './src/js/app.js',    // JavaScript entry point
  styles: './src/scss/main.scss', // SCSS entry point
  assets: './public',            // Static files
  partials: './src/partials',    // Reusable components
  
  // Output
  outputDir: './build',          // Build output directory
};
```

## Auto-Detection Rules

If paths are not specified, Clovie automatically detects:

1. **Views**: `./views/` directory
2. **Scripts**: `./scripts/main.js` or `./scripts/app.js`
3. **Styles**: `./styles/main.scss` or `./styles/main.css`
4. **Assets**: `./assets/` directory
5. **Partials**: `./partials/` directory
6. **Output**: `./dist/` directory
