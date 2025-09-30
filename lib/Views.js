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
          const templates = this.#readTemplates(viewFiles, viewsDir, file);
          
          // Process partials if directory provided
          const partials = partialsDir ? await this.#processPartials(partialsDir, file) : {};
          
          // Convert templates to pages format with provided data
          const pages = this.#createPages(templates, data);
          
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

  #readTemplates(files, srcDir, fileService) {
    const templates = {};
    
    for (const file of files) {
      const content = fileService.readFile(file);
      if (content) {
        // Create relative path key
        const relativePath = path.relative(srcDir, file);
        templates[relativePath] = content;
      }
    }
    
    return templates;
  }

  #createPages(templates, data) {
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
    
    return pages;
  }

  async #processPartials(partialsDir, fileService) {
    if (!fileService.exists(partialsDir)) {
      console.warn(`Partials directory does not exist: ${partialsDir}`);
      return {};
    }

    try {
      const partialFiles = fileService.readNames(partialsDir);
      const partials = {};
      
      for (const file of partialFiles) {
        const content = fileService.readFile(file);
        if (content) {
          // Use filename without extension as key
          const fileName = path.parse(file).name;
          partials[fileName] = content;
        }
      }
      
      return partials;
    } catch (err) {
      console.error(`Error processing partials from ${partialsDir}:`, err);
      return {};
    }
  }
}
