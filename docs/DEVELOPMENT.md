# Clovie Docs Development

This documentation site can use either the local development version of Clovie or the published npm package.

## Development Workflow

### Using Local Clovie (for testing changes)

1. **Link to local version:**
   ```bash
   npm run link-local
   ```

2. **Develop and test:**
   ```bash
   npm run dev    # Start development server
   npm run build  # Build for testing
   ```

### Deploying (using published npm package)

1. **Unlink and use published version:**
   ```bash
   npm run deploy
   ```

   This will:
   - Unlink the local version
   - Install the published npm package
   - Build the site for deployment

## Manual Commands

If you need more control:

```bash
# Link to local development version
npm link clovie

# Unlink and use published version
npm unlink clovie
npm install clovie@0.1.3

# Check which version is being used
ls -la node_modules/clovie
```

## Notes

- The symlink (`node_modules/clovie -> ../..`) indicates you're using the local version
- A regular directory indicates you're using the published npm package
- Always use `npm run deploy` before deploying to ensure you're using the published version
