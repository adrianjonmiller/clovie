#!/usr/bin/env node
import path from "path";
import commandLineArgs from "command-line-args";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local
import ATX from "../lib/core/index.js";

// Commandline options
const mainDefinitions = [
  { name: 'command', defaultOption: true },
  { name: 'create', alias: 'c', type: String }
];
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || [];

// Command-specific options
const optionDefinitions = [
  { name: 'config', alias: 'c', type: String, defaultValue: 'app.config.js' },
  { name: 'watch', alias: 'w', type: Boolean },
  { name: 'template', alias: 't', type: String, defaultValue: 'default' }
];

const options = commandLineArgs(optionDefinitions, { argv });

// Handle create command
if (mainOptions.create) {
  const fs = await import('fs');
  const projectPath = path.resolve(process.cwd(), mainOptions.create);
  
  if (fs.existsSync(projectPath)) {
    console.error(`Error: Directory '${mainOptions.create}' already exists`);
    process.exit(1);
  }
  
  // Copy template files
  const templateDir = path.join(__dirname, '../templates/default');
  
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
        content = content.replace(/\{\{projectName\}\}/g, mainOptions.create);
        fs.writeFileSync(destPath, content);
      }
    }
  };
  
  try {
    await copyDir(templateDir, projectPath);
    console.log(`✅ ATX project created successfully at ${projectPath}`);
    console.log('\nNext steps:');
    console.log(`  cd ${mainOptions.create}`);
    console.log('  npm install');
    console.log('  npm run dev');
    process.exit(0);
  } catch (err) {
    console.error('Error creating project:', err);
    process.exit(1);
  }
}

// Handle watch command
if (mainOptions.command === 'watch') {
  options.watch = true;
}

// Config path
const configPath = path.resolve(process.cwd(), options.config);

// Main function
async function main() {
  try {
    console.log('🔧 CLI Debug Info:');
    console.log('   mainOptions:', mainOptions);
    console.log('   options:', options);
    console.log('   options.watch:', options.watch);
    
    // Config file
    const configModule = await import(configPath);
    const config = configModule.default || configModule;

    // New ATX instance
    const site = new ATX(config);

    site.error(err => {
      console.error(err);
      process.exit(1);
    });

    if (options.watch) {
      console.log('🚀 Starting watch mode...');
      console.log('   site.startWatch method exists:', typeof site.startWatch);
      console.log('   site.startWatch method:', site.startWatch);
      console.log('   site methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(site)));
      console.log('   About to call site.startWatch()...');
      await site.startWatch();
      console.log('   site.startWatch() completed');
    } else {
      console.log('🚀 Starting build mode...');
      await site.build();
      console.log('Build complete');
      process.exit(0);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Run main function
main();