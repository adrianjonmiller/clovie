#!/usr/bin/env node
import path from "path";
import commandLineArgs from "command-line-args";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local - import from compiled dist for published package
import { createClovie } from "../dist/index.js";

// Check for create command first (before any argument parsing)
if (process.argv.includes('create') && process.argv.length > 2) {
  const createArgIndex = process.argv.indexOf('create');
  const projectName = process.argv[createArgIndex + 1];
  
  if (!projectName) {
    console.error('Error: Please provide a project name');
    console.error('Usage: clovie create <project-name> [--template <template-type>]');
    console.error('Available templates: default, static, server');
    process.exit(1);
  }
  
  // Parse arguments to get template option
  const createArgs = process.argv.slice(createArgIndex + 2);
  let templateType = 'default';
  
  // Look for --template or -t flag
  const templateIndex = createArgs.findIndex(arg => arg === '--template' || arg === '-t');
  if (templateIndex !== -1 && createArgs[templateIndex + 1]) {
    templateType = createArgs[templateIndex + 1];
  }
  
  // Validate template type
  const validTemplates = ['default', 'static', 'server'];
  if (!validTemplates.includes(templateType)) {
    console.error(`Error: Invalid template type '${templateType}'`);
    console.error(`Available templates: ${validTemplates.join(', ')}`);
    process.exit(1);
  }
  
  const fs = await import('fs');
  const projectPath = path.resolve(process.cwd(), projectName);
  
  if (fs.existsSync(projectPath)) {
    console.error(`Error: Directory '${projectName}' already exists`);
    process.exit(1);
  }
  
  // Copy template files from the specified template
  const templateDir = path.join(__dirname, `../templates/${templateType}`);
  
  // Create project directory first
  fs.mkdirSync(projectPath, { recursive: true });
  
  const copyDir = async (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await copyDir(srcPath, destPath);
      } else {
        let content = fs.readFileSync(srcPath, 'utf8');
        // Replace template variables
        content = content.replace(/\{\{projectName\}\}/g, projectName);
        fs.writeFileSync(destPath, content);
      }
    }
  };
  
  try {
    // Check if template directory exists
    if (!fs.existsSync(templateDir)) {
      console.error(`Error: Template '${templateType}' not found at ${templateDir}`);
      console.error(`Available templates: ${validTemplates.join(', ')}`);
      process.exit(1);
    }
    
    await copyDir(templateDir, projectPath);
    console.log(`✅ Clovie ${templateType} project created successfully!`);
    console.log(`📁 Project location: ${projectPath}`);
    console.log(`🎨 Template: ${templateType}`);
    console.log('\nNext steps:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm run dev');
    
    // Show template-specific next steps
    if (templateType === 'server') {
      console.log('\n🌐 Server template features:');
      console.log('  • API endpoints ready at /api/*');
      console.log('  • Dynamic user profiles at /user/:id');
      console.log('  • Interactive API demos on homepage');
      console.log('  • Use "npm run start" for production server');
    } else if (templateType === 'static') {
      console.log('\n📄 Static template features:');
      console.log('  • SEO optimized pages');
      console.log('  • Modern responsive design');
      console.log('  • Ready for JAMstack deployment');
      console.log('  • Use "npm run build" to generate static files');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating project:', err);
    process.exit(1);
  }
}

// Commandline options for other commands
const mainDefinitions = [
  { name: 'command', defaultOption: true },
  { name: 'watch', alias: 'w', type: Boolean }
];
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || [];

// Command-specific options
const optionDefinitions = [
  { name: 'config', alias: 'c', type: String, defaultValue: 'clovie.config.js' },
  { name: 'watch', alias: 'w', type: Boolean },
  { name: 'template', alias: 't', type: String, defaultValue: 'default' }
];

const options = commandLineArgs(optionDefinitions, { argv });



// Handle watch command
if (mainOptions.command === 'watch') {
  options.watch = true;
}

// Handle server command
if (mainOptions.command === 'server') {
  options.server = true;
}

// Config path
const configPath = path.resolve(process.cwd(), options.config);

// Main function
async function main() {
  try {
    // Config file - use default if not found
    let config;
    try {
      const configModule = await import(configPath);
      config = configModule.default || configModule;
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND') {
        // Use default config if clovie.config.js not found
        const defaultConfigModule = await import('../config/clovie.config.js');
        config = defaultConfigModule.default;
        console.log('📁 Using default Clovie configuration');
      } else {
        throw err;
      }
    }

    // Override config type if server command is used
    if (options.server) {
      config.type = 'server';
    }

    // New Clovie instance
    const clovie = await createClovie(config);

    if (options.server) {
      // Server mode - run as Express server
      console.log('🌐 Starting server mode...');
      
      // Load data into state first
      if (config.data) {
        console.log('📊 Loading data into state...');
        let loadedData = {};
        if (typeof config.data === 'function') {
          loadedData = await config.data();
        } else if (typeof config.data === 'object') {
          loadedData = config.data;
        }
        clovie.state.load(loadedData);
        console.log(`   Loaded ${Object.keys(loadedData).length} data sources into state`);
      }
      
      // Start server
      clovie.server.start();
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping server...');
        clovie.server.stop();
        process.exit(0);
      });
      
    } else if (options.watch) {
      // Development mode with file watching
      console.log('🏗️  Initial build...');
      await clovie.build.static();
      console.log('✅ Initial build completed\n');
      
      // Start development server
      clovie.server.start();
      
      // Set up file watching
      console.log('👀 Setting up file watching...');
      const watchPaths = [
        config.views,
        config.partials,
        config.styles,
        config.scripts,
      ].filter(Boolean); // Remove undefined paths
      
      const watchers = clovie.file.watch(watchPaths);
      
      // Set up event handlers for each watcher
      watchers.forEach(watcher => {
        watcher.on('change', async (filePath) => {
          console.log(`🔄 File changed: ${filePath}`);
          console.log('🔄 Triggering rebuild...');
          
          try {
            const result = await clovie.build.static();
            console.log(`✅ Rebuild completed in ${result.buildTime}ms`);
            
            // Notify live reload
            if (clovie.server && clovie.server.notifyReload) {
              clovie.server.notifyReload();
            }
          } catch (error) {
            console.error('❌ Rebuild failed:', error.message);
          }
        });
        
        watcher.on('error', (error) => {
          console.error('❌ File watcher error:', error);
        });
      });
      
      console.log(`🌐 Development server running at http://localhost:${config.port || 3000}`);
      console.log('👀 Watching for file changes...');
      console.log('Press Ctrl+C to stop the server\n');
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping development server...');
        if (clovie.file.isWatching()) {
          clovie.file.stopWatching();
        }
        process.exit(0);
      });
      
    } else {
      // Build mode
      const result = await clovie.build.static();
      console.log(`✅ Build completed in ${result.buildTime}ms`);
      console.log(`📁 Generated ${result.filesGenerated} files`);
      process.exit(0);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Run main function
main();