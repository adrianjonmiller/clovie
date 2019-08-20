const fs = require('fs');
const path  = require('path');

module.exports = function (src) {
    let fileNames = fs.existsSync(src) ? getFileNames(src) : null;
    return fileNames ? getTemplates(fileNames, src) : null;
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
    accumulator[key] = fs.readFileSync(file);
    return files.length ? getTemplates(files, src, accumulator) : accumulator;
}