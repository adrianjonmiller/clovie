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

      write: (filePath, content) => {
        const dir = path.dirname(filePath);
  
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      
        try {
          // Check if the value is a Buffer (binary data) or string
          const options = Buffer.isBuffer(content) ? {} : { encoding: 'utf8' };
          
          fs.writeFileSync(filePath, content, options);
        } catch (err) {
          console.error(`Error writing file ${dest}:`, err);
          throw err;
        }
        
        return 'success';
      },
      
      // Clean the output directory
      clean: (dirPath) => {
        try {
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`🗑️  Cleaned directory: ${dirPath}`);
          }
        } catch (err) {
          console.error(`Error cleaning directory ${dirPath}:`, err);
        }
      },
      
      // Essential file I/O methods
      readFile: (filePath) => this.#readFile(filePath),

      // Build a file map from a directory or array of file paths
      buildFileMap: (paths, options = {}) => {
        const {
          recursive = true,
          includeExtensions = null,
          excludeExtensions = null,
          filter = null
        } = options;

        const fileMap = {};
        const pathsArray = Array.isArray(paths) ? paths : [paths];

        const processFile = (filePath) => {
          try {
            if (!fs.existsSync(filePath)) {
              console.warn(`File does not exist: ${filePath}`);
              return;
            }

            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
              if (recursive) {
                const files = fs.readdirSync(filePath, { withFileTypes: true });
                for (const file of files) {
                  const fullPath = path.join(filePath, file.name);
                  processFile(fullPath);
                }
              }
            } else if (stat.isFile()) {
              // Apply extension filters
              const ext = path.extname(filePath).toLowerCase();
              
              if (includeExtensions && !includeExtensions.includes(ext)) {
                return;
              }
              
              if (excludeExtensions && excludeExtensions.includes(ext)) {
                return;
              }

              // Apply custom filter
              if (filter && !filter(filePath)) {
                return;
              }

              // Read file content
              const content = this.#readFile(filePath);
              if (content !== null) {
                fileMap[filePath] = content;
              }
            }
          } catch (err) {
            console.error(`Error processing file ${filePath}:`, err);
          }
        };

        // Process all provided paths
        pathsArray.forEach(processFile);

        return fileMap;
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
      watch: (paths, handler, options = {}) => {
        const defaultOptions = {
          ignored: /(^|[\/\\])\../, // Ignore hidden files
          persistent: true,
          ignoreInitial: true
        };

        const watchOptions = { ...defaultOptions, ...options };
        
        // Handle both single path and array of paths
        const pathsArray = Array.isArray(paths) ? paths : [paths];
        const newWatchers = [];
        
        for (const watchPath of pathsArray) {
          if (!fs.existsSync(watchPath)) {
            console.warn(`⚠️  Watch path does not exist: ${watchPath}`);
            continue;
          }

          console.log(`👀 Watching: ${watchPath}`);
          
          const watcher = chokidar.watch(watchPath, watchOptions);
          
          // Add basic event logging to debug if chokidar is working
          watcher.on('ready', () => {
            console.log(`   ✅ Watcher ready for: ${watchPath}`);
          });
          
          watcher.on('error', (error) => {
            console.error(`   ❌ Watcher error for ${watchPath}:`, error);
          });

          // Add change event handler with debugging
          watcher.on('change', (filePath) => {
            console.log(`🔄 File changed: ${filePath}`);
            const content = this.#readFile(filePath);
            if (handler && content !== null) {
              handler(filePath, content, 'change');
            }
          });

          watcher.on('add', (filePath) => {
            console.log(`➕ File added: ${filePath}`);
            const content = this.#readFile(filePath);
            if (handler && content !== null) {
              handler(filePath, content, 'add');
            }
          });

          watcher.on('unlink', (filePath) => {
            console.log(`➖ File removed: ${filePath}`);
            if (handler) {
              handler(filePath, null, 'unlink');
            }
          });
          
          newWatchers.push(watcher);
        }

        this.#isWatching = true;
        this.#watchers.push(...newWatchers);
        
        return () => {
          newWatchers.forEach(watcher => {
            watcher.close();
          });
        }
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

  #readFile(filePath) {
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
  }
}