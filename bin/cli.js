#!/usr/bin/env node
import path from "path";
import commandLineArgs from "command-line-args";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local - import from compiled dist for published package
import { createClovie } from "../lib/createClovie.js";

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
    console.log('🚀 Starting Clovie...');
    
    // Step 1: Load config file (with fallback to default)
    let config;
    try {
      const configModule = await import(configPath);
      config = configModule.default || configModule;
      console.log(`📁 Using config: ${options.config}`);
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

    // Step 2: Apply CLI overrides
    if (options.server) {
      config.type = 'server';
      console.log('🌐 CLI override: Setting type to server');
    }
    
    if (options.watch) {
      config.watch = true;
      console.log('👀 CLI override: Enabling watch mode');
    }

    // Step 3: Pass everything to Clovie
    console.log('⚙️  Creating Clovie instance...');
    const clovie = await createClovie({
      ...config,
      configPath: configPath
    });

    // Step 4: Let Clovie handle the rest
    console.log('🎯 Handing control to Clovie...');
    
    // Clovie will handle all the logic based on the config
    // We just need to keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Error starting Clovie:', err);
    process.exit(1);
  }
}

// Run main function
main();