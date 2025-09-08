import fs from 'fs';
import path from 'path';
import { isText } from 'istextorbinary';

/**
 * Reads multiple files and returns a map of file paths to file contents
 * @param {string[]} files - Array of file paths
 * @param {string} src - Source directory path
 * @param {Object} accumulator - Accumulator object for results
 * @returns {Object} Map of file paths to file contents
 */
export function readFilesToMap(files, src, accumulator = {}) {
  if (files.length === 0) return accumulator;
  
  let file = files.shift();
  if (!file) return accumulator;
  
  let key = file.substring(path.join(src).length);
  
  // Read file as buffer first
  const buffer = fs.readFileSync(file);
  
  // Use istextorbinary to detect if file is text or binary
  if (isText(file, buffer)) {
    // Read text files as UTF-8 string
    accumulator[key] = buffer.toString('utf8');
  } else {
    // Keep binary files as Buffer
    accumulator[key] = buffer;
  }
  
  return files.length ? readFilesToMap(files, src, accumulator) : accumulator;
}

// Keep the old name as an alias for backward compatibility
export const getTemplates = readFilesToMap;