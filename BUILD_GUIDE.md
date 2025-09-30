# Clovie - Build & Publishing Guide

This guide explains how to build and publish Clovie using the automated build system.

## Overview

The build system creates optimized, bundled versions of Clovie that can be distributed via NPM. The system includes:

- **ES Module Bundle**: Modern JavaScript modules for Node.js 18+
- **CommonJS Bundle**: Compatibility bundle for older Node.js versions
- **TypeScript Definitions**: Full type definitions for TypeScript users
- **Documentation**: Automated documentation building
- **Testing**: Comprehensive test suite execution

## Build Configuration

### Bundle Features

The build includes:

- **Dependency Bundling**: Core Clovie services bundled together
- **External Dependencies**: Large dependencies (Express, Socket.IO, etc.) kept external
- **Source Maps**: Full source map support for debugging
- **Light Minification**: Readable minification that preserves debugging capability
- **TypeScript Support**: Generated type definitions for full IDE support

### Bundle Outputs

The build creates:

- `dist/index.js` - ES module bundle (main entry point)
- `dist/index.cjs` - CommonJS bundle (compatibility)
- `dist/index.d.ts` - TypeScript definitions

## Build Commands

### Basic Building

```bash
# Build the project
npm run build

# Clean and rebuild
npm run clean && npm run build

# Development build with watch mode
npm run dev
```

### Size and Quality Checks

```bash
# Check bundle sizes
npm run size-check

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build documentation
npm run docs:build
```

## Publishing Workflow

### Automated Publishing Script

The `scripts/publish.js` provides a comprehensive publishing workflow:

```bash
# Show available commands
npm run publish:info

# Test everything without publishing
npm run publish:dry-run

# Update version and prepare for publish
npm run publish:patch    # 0.1.5 -> 0.1.6
npm run publish:minor    # 0.1.5 -> 0.2.0
npm run publish:major    # 0.1.5 -> 1.0.0

# Publish beta version
npm run publish:beta

# Publish to NPM (after version update)
npm run publish:do
```

### Step-by-Step Publishing

1. **Prepare Release**:
   ```bash
   npm run publish:dry-run
   ```
   This will:
   - Build the project
   - Run all tests
   - Build documentation
   - Check bundle sizes
   - Run npm publish dry-run
   - Show what will be published

2. **Update Version**:
   ```bash
   npm run publish:patch  # or minor/major
   ```
   This will:
   - Update package.json version
   - Build everything
   - Run tests and checks
   - Prepare for publishing

3. **Publish to NPM**:
   ```bash
   npm run publish:do
   ```

### Beta Releases

For testing new features:

```bash
npm run publish:beta
```

This publishes with the `beta` tag, allowing users to install with:
```bash
npm install clovie@beta
```

## Package Structure

### Published Files

The published package includes:

```
clovie/
├── dist/                 # Built bundles
│   ├── index.js         # ES module
│   ├── index.cjs        # CommonJS
│   └── index.d.ts       # TypeScript definitions
├── bin/                 # CLI executable
│   └── cli.js
├── config/              # Default configuration
│   └── clovie.config.js
├── templates/           # Project templates
│   └── default/
├── README.md
└── LICENSE
```

### Entry Points

The package provides multiple entry points:

- **Main**: `dist/index.cjs` (CommonJS for Node.js compatibility)
- **Module**: `dist/index.js` (ES modules for modern Node.js)
- **Types**: `dist/index.d.ts` (TypeScript definitions)
- **CLI**: `bin/cli.js` (Command line interface)

### Import Examples

```javascript
// ES modules (Node.js 18+)
import { createClovie } from 'clovie';

// CommonJS (older Node.js)
const { createClovie } = require('clovie');

// TypeScript (full type support)
import { createClovie, ClovieConfig } from 'clovie';
```

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development build (watch mode)
npm run dev

# Run tests in watch mode
npm run test:watch

# Build documentation locally
npm run docs:dev
```

### Testing Changes

```bash
# Run full test suite
npm test

# Test with coverage
npm run test:coverage

# Test the build process
npm run build && npm run size-check
```

### Pre-publish Checklist

Before publishing, ensure:

1. ✅ All tests pass: `npm test`
2. ✅ Build succeeds: `npm run build`
3. ✅ Documentation builds: `npm run docs:build`
4. ✅ Bundle sizes are reasonable: `npm run size-check`
5. ✅ Dry run succeeds: `npm run publish:dry-run`
6. ✅ Version is updated appropriately
7. ✅ README and docs are up to date

## Troubleshooting

### Common Build Issues

**"Cannot resolve module"**
- Check that all dependencies are listed in package.json
- Verify external dependencies are properly excluded in rollup.config.js

**"Build fails with syntax error"**
- Ensure all source files use valid ES module syntax
- Check that imports/exports are correctly structured

**"Types generation fails"**
- Verify the build-types.js script has proper permissions
- Check that the dist directory exists before type generation

### Publishing Issues

**"npm publish fails"**
- Ensure you're logged into npm: `npm whoami`
- Check package name availability: `npm info clovie`
- Verify package.json has correct repository URLs

**"Version conflicts"**
- Use `npm run publish:info` to check current version
- Ensure version hasn't already been published

## Continuous Integration

For automated builds and publishing, the workflow supports:

- **GitHub Actions**: Use the publish scripts in CI/CD pipelines
- **Automated Testing**: All commands are CI-friendly
- **Version Management**: Automated version bumping
- **Documentation**: Automated docs building and deployment

Example GitHub Action:

```yaml
name: Publish
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run publish:dry-run
      - run: npm run publish:do
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

This build system provides a robust, automated workflow for maintaining and publishing Clovie while ensuring quality and consistency.
