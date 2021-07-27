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

  if (value && !value.name.startsWith('.')) {
    let name = path.join(PATH, value.name);
    let res = value.isDirectory() ? getFileNames(name) : name;
  
    if (Array.isArray(res)) {
      accumulator = accumulator.concat(res)
    } else {
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
  if (!path.parse(key).name.startsWith('_')) {
    let template = templates[key];
    accumulator[key] = {
      template,
      data
    };
  }
  
  return keys.length ? getPages(templates, data, keys, accumulator) : accumulator;
}

function parseModels (templates, data, models, keys = Object.keys(models), accumulator = {}) {
  let key = keys.shift();
  let configSet = models[key];
  let dataKey = 'ref' in configSet ? configSet.ref : key;
  let pageSize = 'paginate' in configSet ? configSet.paginate : null;
  let dataSet = dataKey in data ? data[dataKey] : {};
  
  if (!Array.isArray(dataSet)) {
    throw `${key} in data needs to be an array`
  }

  dataSet = pageSize ? paginate(dataSet, pageSize) : dataSet;
  let next = getModelTemplates(templates, {dataSet, global: data}, configSet);
  accumulator = Object.assign(accumulator, next);
  return keys.length ? parseModels(templates, data, models, keys, accumulator) : accumulator;
}

function getModelTemplates (templates, data, config, keys = Object.keys(data.dataSet), prev = null, accumulator = {}) {
  let key = keys.shift();
  let next = keys.length ? keys[0] : null
  let local = data.dataSet[key];
  let {output, template, templateData} = getConfig(templates, config, local, key, prev, next);

  if (template && templateData) {
    accumulator[output] = {
      template,
      data: {local: templateData, ...data.global}
    }
  }

  return keys.length ? getModelTemplates(templates, data, config, keys, key, accumulator) : accumulator;
}

function getConfig (templates, config, local, key, prev, next) {
  let templateName = 'template' in config ? path.normalize(`/${config.template}`) : null;
  let output = 'output' in config ? config.output(local, key, prev, next) : `${key}.html`;
  let templateData = 'transform' in config ? config.transform(local) : local;
  let template =  templateName &&  templateName in templates ? templates[templateName] : null;
  return {output, templateData, template};
}

function paginate (arr, size) {
  return arr.reduce((acc, val, i) => {
    let idx = Math.floor(i / size)
    let page = acc[idx] || (acc[idx] = [])
    page.push(val)

    return acc
  }, [])
}