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
  };

  #watchers = [];
  #isWatching = false;

  actions(useContext) {
    return {
      // Existing methods
      readNames: (PATH) => {
        const files = fs.readdirSync(PATH, { withFileTypes: true });
        const accumulator = [];
        
        for (const value of files) {
          const name = path.join(PATH, value.name);
          const res = value.isDirectory() ? this.readNames(name) : name;
      
          if (Array.isArray(res)) {
            accumulator.push(...res);
          } else {
            accumulator.push(res);
          }
        }
        
        return accumulator;
      },

      write: (pages, outputDir) => {
        const keys = Object.keys(pages);
        const accumulator = {};
        
        for (const key of keys) {
          const value = pages[key];
      
          if (accumulator[key] != value) {
            const dest = path.join(outputDir, key);
            const dir = path.dirname(dest);
      
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          
            try {
              // Check if the value is a Buffer (binary data) or string
              const options = Buffer.isBuffer(value) ? {} : { encoding: 'utf8' };
              
              fs.writeFileSync(dest, value, options);
            } catch (err) {
              console.error(`Error writing file ${dest}:`, err);
              throw err;
            }
          }
        }
        
        return 'success';
      },
      
      // Essential file I/O methods
      readFile: (filePath) => {
        try {
          if (!fs.existsSync(filePath)) {
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
      },

      createDirectory: (dirPath) => {
        try {
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            return true;
          }
          return false; // Directory already exists
        } catch (err) {
          console.error(`Error creating directory ${dirPath}:`, err);
          return false;
        }
      },

      exists: (path) => {
        try {
          return fs.existsSync(path);
        } catch (err) {
          return false;
        }
      },
      
      // Path utilities
      getFileName: (filePath) => path.basename(filePath),

      getFileExtension: (filePath) => path.extname(filePath),

      getBaseName: (filePath) => path.parse(filePath).name,

      // File watching methods
      watch: (paths, options = {}) => {
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
          if (!fs.existsSync(watchPath)) {
            console.warn(`⚠️  Watch path does not exist: ${watchPath}`);
            continue;
          }

          console.log(`👀 Watching: ${watchPath}`);
          
          const watcher = chokidar.watch(watchPath, watchOptions);
          this.#watchers.push(watcher);
        }

        this.#isWatching = true;
        return this.#watchers;
      },

      stopWatching: () => {
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
      },

      isWatching: () => this.#isWatching,
    }
  }
  
}