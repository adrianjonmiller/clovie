#!/usr/bin/env node
const path = require("path");
const commandLineArgs = require("command-line-args");

// Local
const ATX = require("../src");

// Commandline options
const mainDefinitions = [{ name: 'command', defaultOption: true }];
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || [];

// Command-specific options
const optionDefinitions = [
  { name: 'config', alias: 'c', type: String, defaultValue: 'app.config.js' },
  { name: 'watch', alias: 'w', type: Boolean }
];

const options = commandLineArgs(optionDefinitions, { argv });

// Handle watch command
if (mainOptions.command === 'watch') {
  options.watch = true;
}

// Config path
const configPath = path.resolve(process.cwd(), options.config);

// Config file
const config = require(configPath);

// New ATX instance
const site = new ATX(config);

site.error(err => {
  console.error(err);
  process.exit(1);
});

if (options.watch) {
  site.build().then(() => {
    site.watch();
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  site.build().then(() => {
    console.log('Build complete');
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}