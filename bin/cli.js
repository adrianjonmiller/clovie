#!/usr/bin/env node

// NPM
const path = require("path");
const commandLineArgs = require("command-line-args");

// Local
const ATX = require("../lib");
const create = require('../lib/create');
const optionDefinitions = require("./optionDefinitions");
const options = commandLineArgs(optionDefinitions);

if (options.create) {
  if (typeof options.create === 'string') {
    // New project path
    const newProjectPath = path.resolve(process.cwd(), options.create);

    // Clone Boilerplate
    create(newProjectPath)
  } else {
    console.log('Please specify a direction to create your new project in.')
  }
} else if (options.watch) {
  // Config path
  const configPath = path.resolve(process.cwd(), options.config);

  // Config file
  const config = require(configPath);

  // New ATX instance
  const site = new ATX(config);

  site.error(err => {
    console.log(err);
  });

  site.build().then(() => {
    site.watch();
  });
} else if (options.build) {
  // Config path
  const configPath = path.resolve(process.cwd(), options.config);

  // Config file
  const config = require(configPath);

  // New ATX instance
  const site = new ATX(config);

  site.error(err => {
    console.log(err);
  });

  site.build().then(() => {
    process.nextTick(() => {
      console.log('Build complete')
      process.exit();
    })
  })
} else {
  console.log('Please specify a command, --build, --create, --watch')
}
