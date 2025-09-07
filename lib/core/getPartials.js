import fs from 'fs';
import path from 'path';
import { readFilesToMap } from '../utils/readFilesToMap.js';

export default function (partialsPath) {
  try {
    if (!partialsPath || !fs.existsSync(partialsPath)) {
      console.warn(`Partials directory does not exist: ${partialsPath}`);
      return {};
    }
    
    // Get all files from the partials directory
    const fileNames = getFileNames(partialsPath);
    const templates = fileNames ? readFilesToMap(fileNames, partialsPath) : {};
    
    // Convert templates to partials object with filename as key (without extension)
    const partials = {};
    for (const [filePath, template] of Object.entries(templates)) {
      const fileName = path.parse(filePath).name; // Get filename without extension
      partials[fileName] = template;
    }
    
    return partials;
  } catch (err) {
    console.error(`Error processing partials from ${partialsPath}:`, err);
    return {};
  }
}

function getFileNames (PATH, files = fs.readdirSync(PATH, { withFileTypes: true }), accumulator = [], depth = 0) {
  // Prevent infinite recursion and stack overflow
  const MAX_DEPTH = 50;
  if (depth > MAX_DEPTH) {
    console.warn(`Maximum directory depth exceeded at: ${PATH}`);
    return accumulator;
  }

  if (!files || files.length === 0) return accumulator;
  
  let value = files.shift();
  if (!value) return accumulator;

  try {
    if (value && !value.name.startsWith('.')) {
      let name = path.join(PATH, value.name);
      let res = value.isDirectory() ? getFileNames(name, [], [], depth + 1) : name;
    
      if (Array.isArray(res)) {
        accumulator = accumulator.concat(res)
      } else {
        accumulator.push(res)
      }
    }
  } catch (err) {
    console.error(`Error processing file/directory: ${PATH}/${value?.name}:`, err);
  }

  return files.length ? getFileNames(PATH, files, accumulator, depth) : accumulator;
}
