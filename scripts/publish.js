#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function run(command, options = {}) {
  console.log(`\n> ${command}`);
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      cwd: rootDir,
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    console.error(`Failed to run: ${command}`);
    process.exit(1);
  }
}

function getPackageInfo() {
  const packagePath = join(rootDir, 'package.json');
  return JSON.parse(readFileSync(packagePath, 'utf8'));
}

function updateVersion(type = 'patch') {
  console.log(`\n📦 Updating version (${type})...`);
  run(`npm version ${type} --no-git-tag-version`);
  return getPackageInfo().version;
}

function build() {
  console.log('\n🔨 Building project...');
  run('npm run build');
}

function runTests() {
  console.log('\n🧪 Running tests...');
  run('npm test');
}

function checkSize() {
  console.log('\n📏 Checking bundle size...');
  run('npm run size-check');
}

function dryRun() {
  console.log('\n🔍 Running publish dry run...');
  run('npm publish --dry-run');
}

function publish(tag = 'latest') {
  console.log(`\n🚀 Publishing to NPM (tag: ${tag})...`);
  const publishCmd = tag === 'latest' 
    ? 'npm publish' 
    : `npm publish --tag ${tag}`;
  run(publishCmd);
}

function showPublishInfo() {
  const pkg = getPackageInfo();
  console.log('\n📋 Publish Information:');
  console.log(`   Package: ${pkg.name}@${pkg.version}`);
  console.log(`   License: ${pkg.license}`);
  console.log('   Files to be published:');
  
  try {
    const result = execSync('npm pack --dry-run', { 
      cwd: rootDir, 
      encoding: 'utf8' 
    });
    console.log(result);
  } catch (error) {
    console.log('   (Run "npm pack --dry-run" to see files)');
  }
}

function buildDocs() {
  console.log('\n📚 Building documentation...');
  run('npm run docs:build');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const versionType = args[1] || 'patch';
  const tag = args[1] || 'latest';

  console.log('🍀 Clovie Publisher');
  console.log('===================');

  switch (command) {
    case 'build':
      build();
      checkSize();
      break;

    case 'test':
      runTests();
      break;

    case 'docs':
      buildDocs();
      break;

    case 'dry-run':
      build();
      runTests();
      buildDocs();
      checkSize();
      dryRun();
      showPublishInfo();
      break;

    case 'patch':
    case 'minor':
    case 'major':
      const newVersion = updateVersion(command);
      build();
      runTests();
      buildDocs();
      checkSize();
      dryRun();
      showPublishInfo();
      console.log(`\n✅ Ready to publish version ${newVersion}`);
      console.log('Run "npm run publish:do" to publish to NPM');
      break;

    case 'beta':
      build();
      runTests();
      buildDocs();
      checkSize();
      publish('beta');
      break;

    case 'do':
      publish('latest');
      break;

    case 'info':
      showPublishInfo();
      break;

    case 'help':
    default:
      console.log(`
📚 Usage:
  node scripts/publish.js [command] [options]

🔧 Commands:
  build                 - Build the project and check size
  test                  - Run tests
  docs                  - Build documentation
  dry-run              - Full dry run (build, test, docs, size check, npm dry-run)
  patch|minor|major    - Update version and prepare for publish
  beta                 - Publish beta version
  do                   - Publish to NPM (latest tag)
  info                 - Show publish information
  help                 - Show this help

📝 Examples:
  node scripts/publish.js dry-run    # Test everything without publishing
  node scripts/publish.js patch      # Bump patch version and prepare
  node scripts/publish.js beta       # Publish beta version
  node scripts/publish.js do         # Publish to NPM

⚠️  Note: Always run "dry-run" first to verify everything looks correct!
`);
      break;
  }
}

main();
