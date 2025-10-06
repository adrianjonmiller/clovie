import path from 'path';
import fs from 'fs';

// Add this near the top of the file, after the imports
const DATA_TYPES = {
  FUNCTION: 'function',
  PROMISE: 'promise', 
  STRING: 'string',
  OBJECT: 'object',
  NULL: 'null',
  UNDEFINED: 'undefined',
  NUMBER: 'number',
  BOOLEAN: 'boolean'
};

function detectType(data) {
  if (data === null) return DATA_TYPES.NULL;
  if (data === undefined) return DATA_TYPES.UNDEFINED;
  if (data instanceof Promise) return DATA_TYPES.PROMISE;
  if (typeof data === 'function') return DATA_TYPES.FUNCTION;
  if (typeof data === 'string') return DATA_TYPES.STRING;
  if (typeof data === 'object') return DATA_TYPES.OBJECT;
  if (typeof data === 'number') return DATA_TYPES.NUMBER;
  if (typeof data === 'boolean') return DATA_TYPES.BOOLEAN;
  return 'unknown';
}

export async function transformConfig(config, log = null) {
  // Fallback logger if none provided
  const logger = log || {
    debug: () => {},
    info: (msg) => console.log(msg),
    warn: (msg) => console.warn(msg),
    error: (msg) => console.error(msg)
  };
  const cwd = process.cwd();
  const discovered = { ...config };

  // Handle legacy config key mappings
  if (!discovered.templateCompiler && discovered.compiler) {
    discovered.templateCompiler = discovered.compiler;
  }
  
  if (!discovered.templateRegister && discovered.register) {
    discovered.templateRegister = discovered.register;
  }

  // Normalize provided paths first
  if (discovered.views) {
    discovered.views = normalizePath(discovered.views);
  }
  if (discovered.scripts) {
    discovered.scripts = normalizePath(discovered.scripts);
  }
  if (discovered.styles) {
    discovered.styles = normalizePath(discovered.styles);
  }
  if (discovered.partials) {
    discovered.partials = normalizePath(discovered.partials);
  }
  if (discovered.assets) {
    discovered.assets = normalizePath(discovered.assets);
  }

  // Basic directory auto-detection with proper path normalization
  if (!discovered.views) {
    const viewDirs = ['views', 'templates', 'pages'];
    for (const dir of viewDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.views = normalizePath(dir);
        break;
      }
    }
  }
  
  if (!discovered.scripts) {
    const scriptDirs = ['scripts', 'js'];
    for (const dir of scriptDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.scripts = normalizePath(dir);
        break;
      }
    }
  }
  
  if (!discovered.styles) {
    const styleDirs = ['styles', 'css'];
    for (const dir of styleDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.styles = normalizePath(dir);
        break;
      }
    }
  }
  
  if (!discovered.partials) {
    const partialDirs = ['partials', 'components'];
    for (const dir of partialDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.partials = normalizePath(dir);
        break;
      }
    }
  }
  
  if (!discovered.assets) {
    const assetDirs = ['assets', 'public', 'static'];
    for (const dir of assetDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.assets = normalizePath(dir);
        break;
      }
    }
  }
  
  // Basic config fallbacks
  if (discovered.watch === undefined) {
    discovered.watch = discovered.mode === 'development' || process.env.NODE_ENV === 'development';
  }

  if (!discovered.port && discovered.watch) {
    discovered.port = 3000;
  }

  if (!discovered.outputDir) {
    discovered.outputDir = './dist';
  }

  if (!discovered.data) {
    const dataFiles = ['data.json', 'data.js'];
    for (const file of dataFiles) {
      if (fs.existsSync(path.join(cwd, file))) {
        discovered.data = normalizePath(file);
        break;
      }
    }
  }

  // Fallback to Handlebars if no template compiler is provided
  if (!discovered.templateCompiler) {
    try {
      const Handlebars = await import('handlebars');
      discovered.templateCompiler = (template, data) => {
        try {
          const compiled = Handlebars.default.compile(template);
          return compiled(data);
        } catch (err) {
          logger.warn(`Template compilation error: ${err.message}`);
          return template;
        }
      };
      discovered.templateRegister = (name, template) => {
        Handlebars.default.registerPartial(name, template);
      };
    } catch (err) {
      logger.warn('Handlebars not available. Install with: npm install handlebars');
      // Explicitly set to undefined to ensure tests pass
      discovered.templateCompiler = undefined;
      discovered.templateRegister = undefined;
    }
  }

  // Fallback to Sass if no style compiler is provided
  logger.debug('No style compiler provided, using Sass compiler');
  if (!discovered.styleCompiler) {
    
    try {
      const sass = await import('sass');
      discovered.styleCompiler = async (content, filePath) => {
        try {
          const result = sass.compileString(content, {
            style: 'expanded',
            sourceMap: false
          });
          return result.css;
        } catch (err) {
          // If Sass compilation fails, try to return as CSS
          logger.warn(`Style compilation error in ${filePath}: ${err.message}`);
          return content;
        }
      };
    } catch (err) {
      // If Sass isn't available, fallback to CSS pass-through
      logger.warn('Sass not available. Install with: npm install sass');
      discovered.styleCompiler = async (content, filePath) => content;
    }
  }

  // Fallback to esbuild if no script compiler is provided
  if (!discovered.scriptCompiler) {
    try {
      const esbuild = await import('esbuild');
      discovered.scriptCompiler = async (content, filePath) => {
        try {
          const result = await esbuild.build({
            stdin: {
              contents: content,
              resolveDir: path.dirname(filePath),
            },
            bundle: true,
            format: 'iife',
            target: 'es2015',
            minify: discovered.mode === 'production',
            sourcemap: discovered.mode === 'development',
            write: false,
          });
          return result.outputFiles[0].text;
        } catch (err) {
          logger.warn(`Script compilation error in ${filePath}: ${err.message}`);
          return content;
        }
      };
    } catch (err) {
      // If esbuild isn't available, fallback to JS pass-through
      logger.warn('esbuild not available. Install with: npm install esbuild');
      discovered.scriptCompiler = async (content, filePath) => content;
    }
  }

  // Basic package manager detection
  if (!discovered.packageManager) {
    if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
      discovered.packageManager = 'npm';
    } else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
      discovered.packageManager = 'yarn';
    } else if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
      discovered.packageManager = 'pnpm';
    }
  }

  // Development mode detection
  if (discovered.mode === undefined) {
    discovered.mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }

  // Cache directory fallback
  if (!discovered.cacheDir) {
    discovered.cacheDir = path.join(discovered.outputDir, '.cache');
  }

  // Warn if no views directory
  if (!discovered.views) {
    logger.warn('No views directory found. Create a views/ folder with your templates.');
  }

  if (discovered.data) {
    discovered.data = await resolveData(discovered.data);
  }
  
  return discovered;
}

/**
 * Normalize path to ensure it starts with ./ for relative paths
 */
function normalizePath(inputPath) {
  if (!inputPath) return inputPath;
  
  // If it's already absolute, return as is
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  
  // If it starts with ./ or ../, return as is
  if (inputPath.startsWith('./') || inputPath.startsWith('../')) {
    return inputPath;
  }
  
  // Otherwise, add ./ prefix
  return `./${inputPath}`;
}

/**
 * Resolve data before calling onReady listeners
 * This resolves data upfront as global data for the entire app
 */
async function resolveData(data, depth = 0, maxDepth = 10) {
  if (!data) return;
  
  // Recursion safety check
  if (depth > maxDepth) {
    // Use console.warn as fallback since this is a utility function
    console.warn(`Maximum recursion depth (${maxDepth}) reached in resolveData`);
    return data;
  }

  try {
    const type = detectType(data);
    
    switch (type) {
      case DATA_TYPES.FUNCTION:
        // Execute data function to get global data
        const functionResult = await data();
        // Recursively resolve the result in case it's another function/promise/file
        return await resolveData(functionResult, depth + 1, maxDepth);
        
      case DATA_TYPES.PROMISE:
        // Wait for promise to resolve
        const promiseResult = await data;
        // Recursively resolve the result in case it's another function/promise/file
        return await resolveData(promiseResult, depth + 1, maxDepth);
        
      case DATA_TYPES.STRING:
        // Load data from file
        const dataPath = path.resolve(process.cwd(), data);
        if (fs.existsSync(dataPath)) {
          try {
            if (data.endsWith('.json')) {
              const fileContent = fs.readFileSync(dataPath, 'utf8');
              return JSON.parse(fileContent);
            } else if (data.endsWith('.js')) {
              const file = await import(dataPath);
              // Recursively resolve the imported data with increased depth
              return await resolveData(file.default || file, depth + 1, maxDepth);
            }
          } catch (err) {
            console.warn(`⚠️  Could not load data file ${data}:`, err.message);
            return data; // Return original path on error
          }
        }
        return data; // Return original path if file doesn't exist
        
      case DATA_TYPES.OBJECT:
        // If it's already an object, return as is
        return data;
        
      case DATA_TYPES.NULL:
      case DATA_TYPES.UNDEFINED:
        return data;
        
      default:
        // Return any other type as-is
        return data;
    }
  } catch (err) {
    // Use console.error as fallback since this is a utility function
    console.error('Error resolving data:', err);
    return data; // Return original data on error
  }
}