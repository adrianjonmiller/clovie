const fs = require('fs');
const path  = require('path');

module.exports = function (src, models = {}, data) {
  let fileNames = fs.existsSync(src) ? getFileNames(src) : null;
  let templates = fileNames ? getTemplates(fileNames, src) : null;
  let pages = templates ? getPages(templates, data) : {};
  return Object.keys(models).length ? parseModels(templates, data, models, Object.keys(models), pages) : pages;
}

function getFileNames (PATH, files = fs.readdirSync(PATH, { withFileTypes: true }), accumulator = []) {
  let value = files.shift();
  let name = path.join(PATH, value.name);
  let res = value.isDirectory() ? getFileNames(name) : name;

  if (Array.isArray(res)) {
    accumulator = accumulator.concat(res)
  } else {
    if (!path.parse(res).name.startsWith('_')) {
      accumulator.push(res)
    } 
  }

  return files.length ? getFileNames(PATH, files, accumulator) : accumulator;
}

function getTemplates (files, src, accumulator = {}) {
  let file = files.shift();
  let key = file.substring(path.join(src).length);
  accumulator[key] = fs.readFileSync(file).toString('utf8');
  return files.length ? getTemplates(files, src, accumulator) : accumulator;
}

function getPages (templates, data, keys = Object.keys(templates), accumulator = {}) {
  let key = keys.shift();
  let template = templates[key];
  accumulator[key] = {
    template,
    data
  };
  return keys.length ? getPages(templates, data, keys, accumulator) : accumulator;
}

function parseModels (templates, data, models, keys = Object.keys(models), accumulator = {}) {
  let key = keys.shift();
  let configSet = models[key];
  let dataSet = key in data ? data[key] : null;
  let next = getModelTemplates(templates, dataSet, configSet);
  accumulator = Object.assign(accumulator, next);
  return keys.length ? parseModels(templates, data, models, keys, accumulator) : accumulator;
}

function getModelTemplates (templates, data, config, keys = Object.keys(data), accumulator = {}) {
  let key = keys.shift();
  let value = data[key];
  let {output, template, templateData} = getConfig(templates, config, value, key);
  if (template && templateData) {
    accumulator[output] = {
      template,
      data: templateData
    }
  }
  // console.log(accumulator)
  return keys.length ? getModelTemplates(templates, data, config, keys, accumulator) : accumulator;
}

function getConfig (templates, config, value, key) {
  let templateName = 'template' in config ? path.normalize(`/${config.template}`) : null;
  let output = 'output' in config ? config.output(value) : `${key}.html`;
  let templateData = 'transform' in config ? config.transform(value) : value;
  let template =  templateName &&  templateName in templates ? templates[templateName] : null;
  return {output, templateData, template};
}