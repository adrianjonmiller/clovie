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
    const log = useContext('log');
    return {
      // Existing methods
      getFilePaths: (path, options = {}) => {
        return this.#getFilePaths(path, options);
      },

      write: (filePath, content) => {
        const dir = path.dirname(filePath);

        console.log('writing file', dir);
  
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      
        try {
          // Check if the value is a Buffer (binary data) or string
          const options = Buffer.isBuffer(content) ? {} : { encoding: 'utf8' };
          
          fs.writeFileSync(filePath, content, options);
        } catch (err) {
          log.error(`Error writing file ${filePath}:`, err);
          throw err;
        }
        
        return 'success';
      },
      
      // Clean the output directory
      clean: (dirPath) => {
        try {
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            log.info(`Cleaned directory: ${dirPath}`);
          }
        } catch (err) {
          log.error(`Error cleaning directory ${dirPath}:`, err);
        }
      },
      
      // Essential file I/O methods
      read: (filePath) => this.#readFile(filePath),

      // Build a file map from a directory or array of file paths
      buildFileMap: (paths, options = {}) => {
        const filePaths = this.getFilePaths(paths, options);
        const fileMap = {};
        for (const filePath of filePaths) {
          fileMap[filePath] = this.#readFile(filePath);
        }
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
          log.error(`Error creating directory ${dirPath}:`, err);
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

      // Delete a file
      delete: (filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            log.debug(`Deleted file: ${filePath}`);
            return true;
          }
          return false; // File didn't exist
        } catch (err) {
          log.error(`Error deleting file ${filePath}:`, err);
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
            log.warn(`Watch path does not exist: ${watchPath}`);
            continue;
          }

          log.debug(`Watching: ${watchPath}`);
          
          const watcher = chokidar.watch(watchPath, watchOptions);
          
          // Add basic event logging to debug if chokidar is working
          watcher.on('ready', () => {
            log.debug(`Watcher ready for: ${watchPath}`);
          });
          
          watcher.on('error', (error) => {
            log.error(`Watcher error for ${watchPath}:`, error);
          });

          // Add change event handler with debugging
          watcher.on('change', (filePath) => {
            log.debug(`File changed: ${filePath}`);
            if (handler) {
              handler(filePath, 'change');
            }
            
          });

          watcher.on('add', (filePath) => {
            log.debug(`File added: ${filePath}`);
            if (handler) {
              handler(filePath, 'add');
            }
          });

          watcher.on('unlink', (filePath) => {
            log.debug(`File removed: ${filePath}`);
            if (handler) {
              handler(filePath, 'unlink');
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
          log.debug('File watcher is not running');
          return;
        }

        this.#watchers.forEach(watcher => {
          watcher.close();
        });
        
        this.#watchers = [];
        this.#isWatching = false;
        log.info('File watcher stopped');
      },

      isWatching: () => this.#isWatching,
    }
  }

  #getFilePaths(dirPath, options = {}) {
    const {
      recursive = true,
      includeExtensions = null,
      excludeExtensions = null,
      filter = null
    } = options;

    const files = [];
    
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return files;
    }
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        if (recursive) {
          this.#getFilePaths(fullPath, options);
        }
      } else {
        // It's a file - apply filters
        const ext = path.extname(fullPath);
        
        // Extension filters
        if (includeExtensions && !includeExtensions.includes(ext)) {
          continue;
        }
        
        if (excludeExtensions && excludeExtensions.includes(ext)) {
          continue;
        }
        
        // Custom filter
        if (filter && !filter(fullPath)) {
          continue;
        }
        
        files.push(fullPath);
      }
    }
    
    return files;
  }

  #readFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        // Don't log this as it's expected behavior for optional files
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
      // Get logger from the service context if available
      const log = this.useContext?.('log');
      if (log) {
        log.error(`Error reading file ${filePath}:`, err);
      } else {
        console.error(`Error reading file ${filePath}:`, err);
      }
      return null;
    }
  }
}