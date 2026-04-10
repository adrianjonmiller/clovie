#!/usr/bin/env node
import path from "path";
import commandLineArgs from "command-line-args";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package version
const packageJson = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const CLOVIE_VERSION = packageJson.version;

// Local - import from compiled dist for published package
import { createClovie } from "../lib/createClovie.js";
import { killPort, checkPorts, killCommonPorts } from "../scripts/killPort.js";
import { runSkillsCommand } from "../lib/cli/skillsCommand.js";

// Bundled Cursor skill / agent docs (`clovie skills`, `clovie skills path`, …)
if (process.argv[2] === 'skills') {
  await runSkillsCommand(process.argv.slice(3));
  process.exit(typeof process.exitCode === 'number' && process.exitCode !== 0 ? process.exitCode : 0);
}

// Check for kill command first (before any argument parsing)
if (process.argv.includes('kill')) {
  const killArgIndex = process.argv.indexOf('kill');
  const killArgs = process.argv.slice(killArgIndex + 1);
  
  // Parse kill command options
  const killOptions = commandLineArgs([
    { name: 'port', alias: 'p', type: Number, multiple: true },
    { name: 'common', alias: 'c', type: Boolean },
    { name: 'check', alias: 'k', type: Boolean },
    { name: 'verbose', alias: 'v', type: Boolean }
  ], { argv: killArgs });
  
  try {
    if (killOptions.check) {
      // Check ports
      const ports = killOptions.port || [3000, 3001, 5000, 8000, 8080];
      console.log('🔍 Checking ports...');
      const results = await checkPorts(ports);
      
      for (const [port, info] of Object.entries(results)) {
        if (info.inUse) {
          console.log(`🔴 Port ${port}: Process ${info.pid} is running`);
        } else {
          console.log(`🟢 Port ${port}: Available`);
        }
      }
    } else if (killOptions.common) {
      // Kill common development ports
      console.log('💀 Killing processes on common development ports...');
      const results = await killCommonPorts({ verbose: true });
      
      console.log(`\n📊 Results:`);
      console.log(`  ✅ Killed: ${results.killed.length} processes`);
      console.log(`  ⚪ Not found: ${results.notFound.length} ports`);
      console.log(`  ❌ Errors: ${results.errors.length} failures`);
      
      if (results.killed.length > 0) {
        console.log('\n💀 Killed processes:');
        results.killed.forEach(({ port, pid }) => {
          console.log(`  Port ${port}: Process ${pid}`);
        });
      }
    } else if (killOptions.port && killOptions.port.length > 0) {
      // Kill specific ports
      console.log(`💀 Killing processes on ports: ${killOptions.port.join(', ')}`);
      const results = await killPort(killOptions.port, { verbose: true });
      
      console.log(`\n📊 Results:`);
      console.log(`  ✅ Killed: ${results.killed.length} processes`);
      console.log(`  ⚪ Not found: ${results.notFound.length} ports`);
      console.log(`  ❌ Errors: ${results.errors.length} failures`);
      
      if (results.killed.length > 0) {
        console.log('\n💀 Killed processes:');
        results.killed.forEach(({ port, pid }) => {
          console.log(`  Port ${port}: Process ${pid}`);
        });
      }
    } else {
      // Show help for kill command
      console.log('💀 Clovie Kill Command');
      console.log('');
      console.log('Usage:');
      console.log('  clovie kill --port 3000           Kill process on port 3000');
      console.log('  clovie kill --port 3000 3001      Kill processes on ports 3000 and 3001');
      console.log('  clovie kill --common              Kill processes on common dev ports (3000, 3001, 5000, 8000, 8080)');
      console.log('  clovie kill --check               Check which ports are in use');
      console.log('  clovie kill --check --port 3000   Check specific port');
      console.log('');
      console.log('Options:');
      console.log('  -p, --port <port>     Port number(s) to kill/check');
      console.log('  -c, --common          Kill common development ports');
      console.log('  -k, --check           Check ports instead of killing');
      console.log('  -v, --verbose         Show verbose output');
      console.log('');
      console.log('Examples:');
      console.log('  clovie kill --port 3000');
      console.log('  clovie kill --common');
      console.log('  clovie kill --check');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Kill command error:', error.message);
    process.exit(1);
  }
}

// Check for create command first (before any argument parsing)
if (process.argv.includes('create') && process.argv.length > 2) {
  const createArgIndex = process.argv.indexOf('create');
  const projectName = process.argv[createArgIndex + 1];
  
  if (!projectName) {
    console.error('Error: Please provide a project name');
    console.error('Usage: clovie create <project-name> [--template <template-type>]');
    console.error('Available templates: static (default), server');
    process.exit(1);
  }
  
  // Parse arguments to get template option
  const createArgs = process.argv.slice(createArgIndex + 2);
  let templateType = 'static';  // Default to static template
  
  // Look for --template or -t flag
  const templateIndex = createArgs.findIndex(arg => arg === '--template' || arg === '-t');
  if (templateIndex !== -1 && createArgs[templateIndex + 1]) {
    templateType = createArgs[templateIndex + 1];
  }
  
  // Validate template type
  const validTemplates = ['static', 'server'];
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
        content = content.replace(/\{\{clovieVersion\}\}/g, CLOVIE_VERSION);
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
    console.log(`✅ Clovie project created successfully!`);
    console.log(`📁 Project location: ${projectPath}`);
    console.log(`🎨 Template: ${templateType}`);
    console.log('\nNext steps:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm run dev');
    
    // Show template-specific next steps
    if (templateType === 'server') {
      console.log('\n🌐 Server template features:');
      console.log('  • API endpoints with collection-based database');
      console.log('  • Dynamic routes with server-side rendering');
      console.log('  • Native Node.js HTTP server (Express adapter available)');
      console.log('  • Use "npm start" for production server');
    } else if (templateType === 'static') {
      console.log('\n📄 Static site features:');
      console.log('  • SEO optimized pages with semantic HTML');
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



// Handle legacy command mappings
if (mainOptions.command === 'watch') {
  mainOptions.command = 'dev'; // Map watch to dev
}

if (mainOptions.command === 'server') {
  mainOptions.command = 'serve'; // Map server to serve
}

// Config path
const optsPath = path.resolve(process.cwd(), options.config);

// Main function
async function main() {
  try {
    const command = mainOptions.command || 'dev'; // Default to dev
    console.log(`🚀 Starting Clovie ${command}...`);
    
    // Step 1: Load config file (with fallback to default)
    const config = await loadConfig(options.config);
    
    // Step 2: Determine mode based on command
    const mode = determineMode(command, config);
    
    // Step 3: Create Clovie instance with explicit mode
    console.log('⚙️  Creating Clovie instance...');
    const clovie = await createClovie({
      ...config,
      optsPath: optsPath,
      mode: mode
    });
    
    // Step 4: Execute specific command
    await executeCommand(clovie, command, options);

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
}

// Load configuration with fallback
async function loadConfig(optsPath) {
  try {
    const configModule = await import(optsPath);
    const config = configModule.default || configModule;
    console.log(`📁 Using config: ${options.config}`);
    return config;
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      // Use default config if clovie.config.js not found
      const defaultConfigModule = await import('../config/clovie.config.js');
      const config = defaultConfigModule.default;
      console.log('📁 Using default Clovie configuration');
      return config;
    } else {
      throw err;
    }
  }
}

// Determine mode based on command and config
function determineMode(command, config) {
  // If config explicitly sets mode, use it unless overridden by command
  if (config.mode && !['build', 'serve', 'dev', 'watch'].includes(command)) {
    return config.mode;
  }
  
  // Command-based mode determination
  switch (command) {
    case 'build': 
      return 'production';
    case 'serve': 
      return 'production';
    case 'dev':
    case 'watch': 
      return 'development';
    default: 
      return 'development';
  }
}

// Execute the specific command
async function executeCommand(clovie, command, options) {
  switch (command) {
    case 'build':
      console.log('🔨 Building project...');
      await clovie.run.build();
      console.log('✅ Build completed successfully');
      process.exit(0);
      
    case 'serve':
      console.log('🌐 Starting production server...');
      await clovie.run.serve();
      // Keep process alive for server
      setupGracefulShutdown(clovie);
      break;
      
    case 'dev':
    case 'watch':
      console.log('🚀 Starting development server...');
      await clovie.run.dev();
      // Keep process alive for dev server
      setupGracefulShutdown(clovie);
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('Available commands: build, serve, dev, watch, skills');
      process.exit(1);
  }
}

// Setup graceful shutdown handlers
function setupGracefulShutdown(clovie) {
  let isShuttingDown = false;
  
  const gracefulShutdown = async (signal) => {
    if (isShuttingDown) {
      console.log('⚠️  Shutdown already in progress...');
      return;
    }
    
    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    // Set a timeout to force exit if shutdown hangs
    const forceExitTimeout = setTimeout(() => {
      console.log('⚠️  Shutdown timeout - forcing exit');
      process.exit(1);
    }, 5000); // 5 second timeout
    
    try {
      // Stop server if it's running
      const server = clovie.server;
      if (server && server.isRunning && server.isRunning()) {
        console.log('🔌 Stopping server...');
        await server.stop();
        console.log('✅ Server stopped');
      }
      
      clearTimeout(forceExitTimeout);
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimeout);
      console.error('❌ Error during shutdown:', error.message);
      process.exit(1);
    }
  };
  
  // Handle multiple termination signals (using once to prevent duplicates)
  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.once('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
  
  // Handle uncaught exceptions and unhandled rejections
  process.once('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    await gracefulShutdown('uncaughtException');
  });
  
  process.once('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown('unhandledRejection');
  });
}

// Run main function
main();