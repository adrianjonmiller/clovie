import fs from 'fs';
import path from 'path';

export default function (src) {
    try {
        if (!src || !fs.existsSync(src)) {
            console.warn(`Assets directory does not exist: ${src}`);
            return {};
        }
        
        let fileNames = getFileNames(src);
        return fileNames ? getTemplates(fileNames, src) : {};
    } catch (err) {
        console.error(`Error processing assets from ${src}:`, err);
        return {};
    }
}

function getFileNames (PATH, files = fs.readdirSync(PATH, { withFileTypes: true }), accumulator = []) {
    if (files.length === 0) return accumulator;
    
    let value = files.shift();
    if (!value) return accumulator;
    
    let name = path.join(PATH, value.name);
    let res = value.isDirectory() ? getFileNames(name) : name;
  
    if (Array.isArray(res)) {
      accumulator = accumulator.concat(res)
    } else {
      accumulator.push(res)
    }
  
    return files.length ? getFileNames(PATH, files, accumulator) : accumulator;
  }


function getTemplates (files, src, accumulator = {}) {
    if (files.length === 0) return accumulator;
    
    let file = files.shift();
    if (!file) return accumulator;
    
    let key = file.substring(path.join(src).length);
    accumulator[key] = fs.readFileSync(file);
    return files.length ? getTemplates(files, src, accumulator) : accumulator;
}