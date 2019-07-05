#!/usr/bin/env node

const optionDefinitions = [
  { name: 'config', alias: 'c', type: String, defaultValue: 'app.config.js'}
];

const root = process.cwd();
const path = require("path");
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
const configPath = path.resolve(root, options.config);
const config = require(configPath);
const Atix = require('./lib');
const site = new Atix(config);

site.error(err => {
  console.log(err)
})
site.build();

site.build().then(() => {
  site.watch();
})
