import fs from 'fs';
import path from 'path';
import { isText } from 'istextorbinary';
import chokidar from 'chokidar';
import { ServiceProvider } from '@brickworks/engine';

export class File extends ServiceProvider {
  static manifest = {
    name: 'Clovie File',
    namespace: 'file',
    version: '1.0.0'
  }

  #watchers = [];
  #isWatching = false;

  actions(useContext) {
    return {
      // Existing methods
      readNames: (PATH) => this.#readNames(PATH),
      write: (pages, outputDir) => this.#write(pages, outputDir),
      
      // Essential file I/O methods
      readFile: (filePath) => this.#readFile(filePath),
      createDirectory: (dirPath) => this.#createDirectory(dirPath),
      exists: (path) => this.#exists(path),
      
      // Path utilities
      getFileName: (filePath) => this.#getFileName(filePath),
      getFileExtension: (filePath) => this.#getFileExtension(filePath),
      getBaseName: (filePath) => this.#getBaseName(filePath),

      // File watching methods
      watch: (paths, options = {}) => this.#watch(paths, options),
      stopWatching: () => this.#stopWatching(),
      isWatching: () => this.#isWatching,
    }
  }
  
  #write (pages, outputDir, keys = Object.keys(pages), accumulator = {}) {
    const key = keys.shift();
    const value = pages[key];
  
    if (accumulator[key] != value) {
      const dest = path.join(outputDir, key);
      const dir = path.dirname(dest);
  
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    
      // Check if the value is a Buffer (binary data) or string
      const options = Buffer.isBuffer(value) ? {} : { encoding: 'utf8' };
      
      fs.writeFileSync(dest, value, options, err => {
        if (err) {
          console.log(err)
        }
      });
    }
  
    return keys.length ? this.#write(pages, outputDir, keys, accumulator) : 'success';
  }
  
  #readNames (PATH, files = fs.readdirSync(PATH, { withFileTypes: true }), accumulator = []) {
    if (files.length === 0) return accumulator;
    
    let value = files.shift();
    if (!value) return accumulator;
    
    let name = path.join(PATH, value.name);
    let res = value.isDirectory() ? this.#readNames(name) : name;
  
    if (Array.isArray(res)) {
      accumulator = accumulator.concat(res)
    } else {
      accumulator.push(res)
    }
  
    return files.length ? this.#readNames(PATH, files, accumulator) : accumulator;
  }

  // Essential file I/O methods
  #readFile(filePath) {
    try {
      if (!this.#exists(filePath)) {
        console.warn(`File does not exist: ${filePath}`);
        return null;
      }
      
      const buffer = fs.readFileSync(filePath);
      
      // Use istextorbinary to detect if file is text or binary
      if (isText(filePath, buffer)) {
        return buffer.toString('utf8');
      } else {
        return buffer; // Return as Buffer for binary files
      }
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return null;
    }
  }

  #createDirectory(dirPath) {
    try {
      if (!this.#exists(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        return true;
      }
      return false; // Directory already exists
    } catch (err) {
      console.error(`Error creating directory ${dirPath}:`, err);
      return false;
    }
  }

  #exists(path) {
    try {
      return fs.existsSync(path);
    } catch (err) {
      return false;
    }
  }

  // Path utilities
  #getFileName(filePath) {
    return path.basename(filePath);
  }

  #getFileExtension(filePath) {
    return path.extname(filePath);
  }

  #getBaseName(filePath) {
    return path.parse(filePath).name;
  }

  // File watching methods
  #watch(paths, options = {}) {
    if (this.#isWatching) {
      console.log('👀 File watcher is already running');
      return;
    }

    const defaultOptions = {
      ignored: /(^|[\/\\])\../, // Ignore hidden files
      persistent: true,
      ignoreInitial: true
    };

    const watchOptions = { ...defaultOptions, ...options };
    
    // Handle both single path and array of paths
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    
    for (const watchPath of pathsArray) {
      if (!this.#exists(watchPath)) {
        console.warn(`⚠️  Watch path does not exist: ${watchPath}`);
        continue;
      }

      console.log(`👀 Watching: ${watchPath}`);
      
      const watcher = chokidar.watch(watchPath, watchOptions);
      this.#watchers.push(watcher);
    }

    this.#isWatching = true;
    return this.#watchers;
  }

  #stopWatching() {
    if (!this.#isWatching) {
      console.log('👀 File watcher is not running');
      return;
    }

    this.#watchers.forEach(watcher => {
      watcher.close();
    });
    
    this.#watchers = [];
    this.#isWatching = false;
    console.log('🛑 File watcher stopped');
  }
}