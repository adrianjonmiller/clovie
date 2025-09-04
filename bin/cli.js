#!/usr/bin/env node
import path from "path";
import commandLineArgs from "command-line-args";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local
import Clovie from "../lib/main.js";

// Check for create command first (before any argument parsing)
if (process.argv.includes('create') && process.argv.length > 2) {
  const projectName = process.argv[3]; // The name after 'create'
  
  if (!projectName) {
    console.error('Error: Please provide a project name');
    console.error('Usage: clovie create <project-name>');
    process.exit(1);
  }
  
  const fs = await import('fs');
  const projectPath = path.resolve(process.cwd(), projectName);
  
  if (fs.existsSync(projectPath)) {
    console.error(`Error: Directory '${projectName}' already exists`);
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
        content = content.replace(/\{\{projectName\}\}/g, projectName);
        fs.writeFileSync(destPath, content);
      }
    }
  };
  
  try {
    await copyDir(templateDir, projectPath);
    console.log(`✅ Clovie project created successfully at ${projectPath}`);
    console.log('\nNext steps:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm run dev');
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
  { name: 'config', alias: 'c', type: String, defaultValue: 'app.config.js' },
  { name: 'watch', alias: 'w', type: Boolean },
  { name: 'template', alias: 't', type: String, defaultValue: 'default' }
];

const options = commandLineArgs(optionDefinitions, { argv });



// Handle watch command
if (mainOptions.command === 'watch') {
  options.watch = true;
}

// Config path
const configPath = path.resolve(process.cwd(), options.config);

// Main function
async function main() {
  try {
    // Config file
    const configModule = await import(configPath);
    const config = configModule.default || configModule;

    // New Clovie instance
    const site = new Clovie(config);

    site.error(err => {
      console.error(err);
      process.exit(1);
    });

    if (options.watch) {
      await site.startWatch();
    } else {
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