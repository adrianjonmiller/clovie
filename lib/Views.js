import { ServiceProvider } from '@brickworks/engine';
import path from 'path';

export class Views extends ServiceProvider {
  static manifest = {
    name: 'Clovie Views',
    namespace: 'views',
    version: '1.0.0'
  };

  initialize(useContext, config) {
    this.#config = config;
  }

  #config;

  actions(useContext) {
    const { file, state } = useContext();
    
    return {
      process: async (viewsDir, partialsDir = null, data = {}) => {
        if (!viewsDir || !file.exists(viewsDir)) {
          console.warn(`Views directory does not exist: ${viewsDir}`);
          return { pages: {}, partials: {} };
        }

        try {
          // Get all view files
          const viewFiles = file.readNames(viewsDir);
          
          // Read templates
          const templates = {};
          for (const filePath of viewFiles) {
            const content = file.readFile(filePath);
            if (content) {
              // Create relative path key
              const relativePath = path.relative(viewsDir, filePath);
              templates[relativePath] = content;
            }
          }
          
          // Process partials if directory provided
          let partials = {};
          if (partialsDir) {
            if (!file.exists(partialsDir)) {
              console.warn(`Partials directory does not exist: ${partialsDir}`);
            } else {
              try {
                const partialFiles = file.readNames(partialsDir);
                
                for (const filePath of partialFiles) {
                  const content = file.readFile(filePath);
                  if (content) {
                    // Use filename without extension as key
                    const fileName = path.parse(filePath).name;
                    partials[fileName] = content;
                  }
                }
              } catch (err) {
                console.error(`Error processing partials from ${partialsDir}:`, err);
              }
            }
          }
          
          // Convert templates to pages format with provided data
          const pages = {};
          for (const [filePath, template] of Object.entries(templates)) {
            // Skip files that start with underscore (partials)
            if (path.parse(filePath).name.startsWith('_')) {
              continue;
            }
            
            // Convert to HTML if needed
            const htmlPath = filePath.replace(/\.[^/.]+$/, '.html');
            
            pages[htmlPath] = {
              template,
              data
            };
          }
          
          console.log(`   Processed ${Object.keys(pages).length} views`);
          console.log(`   Loaded ${Object.keys(partials).length} partials`);
          
          return { pages, partials };
        } catch (err) {
          console.error(`Error processing views from ${viewsDir}:`, err);
          return { pages: {}, partials: {} };
        }
      }
    };
  }

}
