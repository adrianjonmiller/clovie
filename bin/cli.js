#!/usr/bin/env node

// NPM
const path = require("path");
const commandLineArgs = require("command-line-args");

// Local
const ATX = require("../lib");
const optionDefinitions = require("../optionDefinitions");
const options = commandLineArgs(optionDefinitions);

// Config path
const configPath = path.resolve(process.cwd(), options.config);

// Config file
const config = require(configPath);

// New ATX instance
const site = new ATX(config);

site.error(err => {
  console.log(err);
});

if (options.watch) {
  site.build().then(() => {
    site.watch();
  });
} else {
  site.build();
}
