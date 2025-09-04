# Clovie Monorepo

A monorepo containing Clovie, a Node.js-based static site generator, and related tools.

## Project Structure

```
clovie-monorepo/
├── packages/
│   ├── clovie/          # Core static site generator
│   │   ├── __tests__/   # Test files
│   │   ├── bin/         # CLI executable
│   │   ├── config/      # Configuration files
│   │   ├── lib/         # Source code
│   │   │   ├── core/    # Core functionality
│   │   │   └── utils/   # Utility functions
│   │   └── package.json
│   ├── templates/       # Project templates
│   └── docs/            # Documentation site (built with Clovie)
├── examples/             # Example configurations for different template engines
└── package.json          # Root package.json with workspace configuration
```

## Packages

### @clovie/core
The main static site generator with support for multiple template engines, asset processing, development server, and project creation.

### @clovie/docs
Documentation site built with Clovie itself, demonstrating the framework's capabilities.

## Getting Started

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests across all packages
npm run test

# Start development server for docs
npm run docs
```

## Development

This is a monorepo using npm workspaces. Each package can be developed independently or as part of the whole project.

### Available Scripts

- `npm run build` - Build all packages
- `npm run dev` - Start development mode for all packages
- `npm run test` - Run tests across all packages
- `npm run docs` - Start the documentation site in development mode

## Template Engine Examples

The `examples/` directory contains sample configurations for different template engines:

- Handlebars
- Mustache
- Nunjucks
- Pug

## License

MIT
