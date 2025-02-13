#!/usr/bin/env node
const path = require("path");
const commandLineArgs = require("command-line-args");
const create = require("../dist");

const optionDefinitions = [
  { name: 'dir', defaultOption: true },
  { name: 'template', alias: 't', type: String, defaultValue: 'default' }
];

const options = commandLineArgs(optionDefinitions);

if (typeof options.dir !== 'string') {
  console.error('Please specify a directory to create your new project in.');
  console.error('Usage: create-atx <directory> [options]');
  console.error('\nOptions:');
  console.error('  -t, --template    Template to use (default: "default")');
  process.exit(1);
}

// New project path
const newProjectPath = path.resolve(process.cwd(), options.dir);

// Create new project
create(newProjectPath, options.template)
  .then((success) => {
    console.log(success);
    console.log('\nNext steps:');
    console.log(`  cd ${options.dir}`);
    console.log('  npm install');
    console.log('  npm run dev');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating project:', error);
    process.exit(1);
  });