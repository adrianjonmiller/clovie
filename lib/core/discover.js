import fs from 'fs';
import path from 'path';

export function discoverProjectStructure(config) {
  const cwd = process.cwd();
  const discovered = { ...config };
  
  // Auto-detect views directory
  if (!discovered.views) {
    const viewDirs = ['views', 'templates', 'pages', 'src/views', 'src/templates'];
    for (const dir of viewDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.views = path.join('./', dir);
        console.log(`🔍 Auto-detected views directory: ${dir}`);
        break;
      }
    }
  }
  
  // Auto-detect scripts directory
  if (!discovered.scripts) {
    const scriptDirs = ['scripts', 'js', 'src/scripts', 'src/js'];
    for (const dir of scriptDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        const mainFiles = ['main.js', 'index.js', 'app.js'];
        for (const file of mainFiles) {
          if (fs.existsSync(path.join(cwd, dir, file))) {
            discovered.scripts = path.join('./', dir, file);
            console.log(`🔍 Auto-detected scripts entry: ${dir}/${file}`);
            break;
          }
        }
        if (discovered.scripts) break;
      }
    }
  }
  
  // Auto-detect styles directory
  if (!discovered.styles) {
    const styleDirs = ['styles', 'css', 'scss', 'src/styles', 'src/css'];
    for (const dir of styleDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        const mainFiles = ['main.scss', 'main.css', 'style.scss', 'style.css'];
        for (const file of mainFiles) {
          if (fs.existsSync(path.join(cwd, dir, file))) {
            discovered.styles = path.join('./', dir, file);
            console.log(`🔍 Auto-detected styles entry: ${dir}/${file}`);
            break;
          }
        }
        if (discovered.styles) break;
      }
    }
  }
  
  // Auto-detect assets directory
  if (!discovered.assets) {
    const assetDirs = ['assets', 'public', 'static', 'src/assets', 'src/public'];
    for (const dir of assetDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.assets = path.join('./', dir);
        console.log(`🔍 Auto-detected assets directory: ${dir}`);
        break;
      }
    }
  }
  
  // Validate required directories
  if (!discovered.views) {
    console.warn('⚠️  No views directory found. Create a views/ folder with your HTML templates.');
  }
  
  return discovered;
}
