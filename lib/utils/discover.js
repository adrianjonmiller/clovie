import fs from 'fs';
import path from 'path';

export async function discoverProjectStructure(config) {
  const cwd = process.cwd();
  const discovered = { ...config };

  if (!discovered.templateCompiler) {
    const compilerKey = ['templateCompiler', 'compiler'];
    for (const key of compilerKey) {
      if (discovered[key]) {
        discovered.templateCompiler = discovered[key];
        break;
      }
    }
  }
  
  if (!discovered.templateRegister) {
    const registerKey = ['templateRegister', 'register'];
    for (const key of registerKey) {
      if (discovered[key]) {
        discovered.templateRegister = discovered[key];
        break;
      }
    }
  }

  if (!discovered.styleCompiler) {
    const compilerKey = ['styleCompiler', 'styleCompiler'];
    for (const key of compilerKey) {
      if (discovered[key]) {
        discovered.styleCompiler = discovered[key];
        break;
      }
    }
  }

  if (!discovered.styleRegister) {
    const registerKey = ['styleRegister', 'styleRegister'];
    for (const key of registerKey) {
      if (discovered[key]) {
        discovered.styleRegister = discovered[key];
        break;
      }
    }
  }

  // Auto-detect script compiler
  if (!discovered.scriptCompiler) {
    const compilerKey = ['scriptCompiler', 'scriptCompiler'];
    for (const key of compilerKey) {
      if (discovered[key]) {
        discovered.scriptCompiler = discovered[key];
        break;
      }
    }
  }

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
        discovered.scripts = path.join('./', dir);
        console.log(`🔍 Auto-detected scripts directory: ${dir}`);
        break;
      }
    }
  }
  
  // Auto-detect styles directory
  if (!discovered.styles) {
    const styleDirs = ['styles', 'css', 'scss', 'src/styles', 'src/css'];
    for (const dir of styleDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.styles = path.join('./', dir);
        console.log(`🔍 Auto-detected styles directory: ${dir}`);
        break;
      }
    }
  }
  
  // Auto-detect partials directory
  if (!discovered.partials) {
    const partialDirs = ['partials', 'components', 'src/partials', 'src/components'];
    for (const dir of partialDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.partials = path.join('./', dir);
        console.log(`🔍 Auto-detected partials directory: ${dir}`);
        break;
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
  
  // Auto-detect watcher configuration
  if (discovered.watch === undefined) {
    // Auto-enable watching if in development mode or if watch is not explicitly set
    discovered.watch = discovered.mode === 'development' || process.env.NODE_ENV === 'development';
    if (discovered.watch) {
      console.log('🔍 Auto-detected watch mode: enabled (development mode)');
    }
  }

  // Auto-detect port for development server
  if (!discovered.port && discovered.watch) {
    discovered.port = 3000;
    console.log('🔍 Auto-detected port: 3000');
  }

  // Auto-detect output directory
  if (!discovered.outputDir) {
    const outputDirs = ['dist', 'build', 'public', 'output', 'site'];
    for (const dir of outputDirs) {
      if (fs.existsSync(path.join(cwd, dir))) {
        discovered.outputDir = path.resolve('./', dir);
        console.log(`🔍 Auto-detected output directory: ${dir}`);
        break;
      }
    }
    // Default to dist if none found
    if (!discovered.outputDir) {
      discovered.outputDir = path.resolve('./dist');
      console.log('🔍 Using default output directory: dist');
    }
  }

  // Auto-detect data sources
  if (!discovered.data) {
    const dataFiles = ['data.json', 'data.js', 'content.json', 'site.json', 'config/data.json'];
    for (const file of dataFiles) {
      if (fs.existsSync(path.join(cwd, file))) {
        discovered.data = path.resolve('./', file);
        console.log(`🔍 Auto-detected data file: ${file}`);
        break;
      }
    }
  }

  // Auto-detect template engine based on file extensions
  if (!discovered.templateCompiler && !discovered.compiler) {
    const viewFiles = discovered.views ? fs.readdirSync(path.join(cwd, discovered.views)) : [];
    const extensions = viewFiles.map(file => path.extname(file));
    
    if (extensions.includes('.hbs') || extensions.includes('.handlebars')) {
      console.log('🔍 Auto-detected template engine: Handlebars (based on .hbs files)');
      // Auto-setup Handlebars fallback
      try {
        const Handlebars = await import('handlebars');
        discovered.templateCompiler = (template, data) => {
          try {
            const compiled = Handlebars.default.compile(template);
            return compiled(data);
          } catch (err) {
            console.warn(`⚠️  Handlebars compilation error: ${err.message}`);
            return template;
          }
        };
        discovered.templateRegister = (name, template) => {
          Handlebars.default.registerPartial(name, template);
        };
        console.log('✅ Auto-configured Handlebars compiler');
      } catch (err) {
        console.warn('⚠️  Handlebars not available, install with: npm install handlebars');
      }
    } else if (extensions.includes('.html') && !discovered.templateCompiler) {
      console.log('🔍 Auto-detected template engine: Handlebars (default for .html files)');
      // Auto-setup Handlebars fallback for HTML files
      try {
        const Handlebars = await import('handlebars');
        discovered.templateCompiler = (template, data) => {
          try {
            const compiled = Handlebars.default.compile(template);
            return compiled(data);
          } catch (err) {
            console.warn(`⚠️  Handlebars compilation error: ${err.message}`);
            return template;
          }
        };
        discovered.templateRegister = (name, template) => {
          Handlebars.default.registerPartial(name, template);
        };
        console.log('✅ Auto-configured Handlebars compiler for HTML files');
      } catch (err) {
        console.warn('⚠️  Handlebars not available, install with: npm install handlebars');
      }
    } else if (extensions.includes('.pug')) {
      console.log('🔍 Auto-detected template engine: Pug (based on .pug files)');
      // Auto-setup Pug fallback
      try {
        const pug = await import('pug');
        discovered.templateCompiler = (template, data) => {
          try {
            return pug.default.render(template, { ...data, pretty: true });
          } catch (err) {
            console.warn(`⚠️  Pug compilation error: ${err.message}`);
            return template;
          }
        };
        discovered.templateRegister = null; // Pug doesn't use partials the same way
        console.log('✅ Auto-configured Pug compiler');
      } catch (err) {
        console.warn('⚠️  Pug not available, install with: npm install pug');
      }
    } else if (extensions.includes('.njk')) {
      console.log('🔍 Auto-detected template engine: Nunjucks (based on .njk files)');
      // Auto-setup Nunjucks fallback
      try {
        const nunjucks = await import('nunjucks');
        discovered.templateCompiler = (template, data) => {
          try {
            return nunjucks.default.renderString(template, data);
          } catch (err) {
            console.warn(`⚠️  Nunjucks compilation error: ${err.message}`);
            return template;
          }
        };
        discovered.templateRegister = (name, template) => {
          nunjucks.default.addGlobal(name, template);
        };
        console.log('✅ Auto-configured Nunjucks compiler');
      } catch (err) {
        console.warn('⚠️  Nunjucks not available, install with: npm install nunjucks');
      }
    } else if (extensions.includes('.mustache')) {
      console.log('🔍 Auto-detected template engine: Mustache (based on .mustache files)');
      // Auto-setup Mustache fallback
      try {
        const mustache = await import('mustache');
        discovered.templateCompiler = (template, data) => {
          try {
            return mustache.default.render(template, data);
          } catch (err) {
            console.warn(`⚠️  Mustache compilation error: ${err.message}`);
            return template;
          }
        };
        discovered.templateRegister = (name, template) => {
          mustache.default.parse(template, { name });
        };
        console.log('✅ Auto-configured Mustache compiler');
      } catch (err) {
        console.warn('⚠️  Mustache not available, install with: npm install mustache');
      }
    }
  }

  // Auto-detect style preprocessor based on file extensions
  if (!discovered.styleCompiler) {
    const styleFiles = discovered.styles ? fs.readdirSync(path.join(cwd, discovered.styles)) : [];
    const extensions = styleFiles.map(file => path.extname(file));
    
    if (extensions.includes('.scss') || extensions.includes('.sass')) {
      console.log('🔍 Auto-detected style preprocessor: Sass (based on .scss/.sass files)');
      // Auto-setup Sass fallback
      try {
        const sass = await import('sass');
        discovered.styleCompiler = async (content, filePath) => {
          try {
            const result = sass.default.compileString(content, {
              style: 'expanded',
              sourceMap: false
            });
            return result.css;
          } catch (err) {
            console.warn(`⚠️  Sass compilation error in ${filePath}: ${err.message}`);
            return content; // Fallback to raw content
          }
        };
        console.log('✅ Auto-configured Sass compiler');
      } catch (err) {
        console.warn('⚠️  Sass not available, install with: npm install sass');
      }
    } else if (extensions.includes('.less')) {
      console.log('🔍 Auto-detected style preprocessor: Less (based on .less files)');
      // Auto-setup Less fallback
      try {
        const less = await import('less');
        discovered.styleCompiler = async (content, filePath) => {
          try {
            const result = await less.default.render(content, {
              filename: filePath
            });
            return result.css;
          } catch (err) {
            console.warn(`⚠️  Less compilation error in ${filePath}: ${err.message}`);
            return content;
          }
        };
        console.log('✅ Auto-configured Less compiler');
      } catch (err) {
        console.warn('⚠️  Less not available, install with: npm install less');
      }
    } else if (extensions.includes('.styl')) {
      console.log('🔍 Auto-detected style preprocessor: Stylus (based on .styl files)');
      // Auto-setup Stylus fallback
      try {
        const stylus = await import('stylus');
        discovered.styleCompiler = async (content, filePath) => {
          return new Promise((resolve, reject) => {
            stylus.default(content)
              .set('filename', filePath)
              .render((err, css) => {
                if (err) {
                  console.warn(`⚠️  Stylus compilation error in ${filePath}: ${err.message}`);
                  resolve(content); // Fallback to raw content
                } else {
                  resolve(css);
                }
              });
          });
        };
        console.log('✅ Auto-configured Stylus compiler');
      } catch (err) {
        console.warn('⚠️  Stylus not available, install with: npm install stylus');
      }
    } else if (extensions.includes('.css')) {
      console.log('🔍 Auto-detected style format: CSS (no preprocessing needed)');
      // Auto-setup CSS pass-through
      discovered.styleCompiler = async (content, filePath) => {
        return content; // No preprocessing needed
      };
      console.log('✅ Auto-configured CSS pass-through');
    }
  }

  // Auto-detect JavaScript bundler/transpiler
  if (!discovered.scriptCompiler) {
    const scriptFiles = discovered.scripts ? fs.readdirSync(path.join(cwd, discovered.scripts)) : [];
    const extensions = scriptFiles.map(file => path.extname(file));
    
    if (extensions.includes('.ts')) {
      console.log('🔍 Auto-detected script language: TypeScript (based on .ts files)');
    } else if (extensions.includes('.jsx')) {
      console.log('🔍 Auto-detected script language: JSX (based on .jsx files)');
    } else if (extensions.includes('.tsx')) {
      console.log('🔍 Auto-detected script language: TSX (based on .tsx files)');
    }
  }

  // Auto-detect package manager
  if (!discovered.packageManager) {
    if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
      discovered.packageManager = 'npm';
      console.log('🔍 Auto-detected package manager: npm');
    } else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
      discovered.packageManager = 'yarn';
      console.log('🔍 Auto-detected package manager: yarn');
    } else if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
      discovered.packageManager = 'pnpm';
      console.log('🔍 Auto-detected package manager: pnpm');
    }
  }

  // Auto-detect development mode
  if (discovered.mode === undefined) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
      discovered.mode = 'development';
      console.log('🔍 Auto-detected mode: development (from NODE_ENV)');
    } else if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
      discovered.mode = 'production';
      console.log('🔍 Auto-detected mode: production (from NODE_ENV)');
    } else {
      discovered.mode = 'development'; // Default to development
      console.log('🔍 Auto-detected mode: development (default)');
    }
  }

  // Auto-detect cache directory
  if (!discovered.cacheDir) {
    discovered.cacheDir = path.join(discovered.outputDir, '.cache');
    console.log('🔍 Auto-detected cache directory: .cache');
  }

  // Validate required directories
  if (!discovered.views) {
    console.warn('⚠️  No views directory found. Create a views/ folder with your HTML templates.');
  }
  
  return discovered;
}
