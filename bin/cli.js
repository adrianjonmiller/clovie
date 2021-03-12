#!/usr/bin/env node

// NPM
const path = require("path");
const commandLineArgs = require("command-line-args");

// Local
const ATX = require("../lib");
const create = require('../lib/create');

// Commandline
const mainDefinitions = require("./optionDefinitions");
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });

switch (mainOptions.command) {
  case 'create':
    const argv = mainOptions._unknown || [];
    const optionDefinitions = [
      { name: 'dir', defaultOption: true }
    ]
    const mergeOptions = commandLineArgs(optionDefinitions, { argv, stopAtFirstUnknown: true })

    if (typeof mergeOptions.dir === 'string') {
      // New project path
      const newProjectPath = path.resolve(process.cwd(), mergeOptions.dir);
  
      // Clone Boilerplate
      create(newProjectPath).then((success) => {
        console.log(success)
      }).catch((error) => {
        console.log(error)
      })
    } else {
      console.log('Please specify a direction to create your new project in.')
    }
  break;

  default: 
    // Config path
    const configPath = path.resolve(process.cwd(), mainOptions.config);

    // Config file
    const config = require(configPath);

    // New ATX instance
    const site = new ATX(config);

    site.error(err => {
      console.log(err);
    });

    if (mainOptions.watch) {
      return site.build().then(() => {
        site.watch();
      });
    }
    
    site.build().then(() => {
      process.nextTick(() => {
        console.log('Build complete')
        process.exit();
      })
    })
  break;
}