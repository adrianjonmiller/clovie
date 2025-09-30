import { ServiceProvider } from '@brickworks/engine';
import { liveReloadScript } from './utils/liveReloadScript.js';

const isPromise = (obj) => {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
};

export class Compiler extends ServiceProvider {
  static manifest = {
    name: 'Clovie Compiler',
    namespace: 'compiler',
    version: '1.0.0'
  }

  #compiledTemplates = new Map();

  initialize(useContext, config) {
    this.templateCompiler = config.templateCompiler || config.compiler; // Support both for backward compatibility
    this.mode = config.mode;
    this.templateRegister = config.templateRegister || config.register; // Support both for backward compatibility
  }

  actions(useContext) {
    return {
      templates: async (views, partials = {}) => {
        const fileNames = Object.keys(views);
        if (!fileNames || fileNames.length === 0) return {};

  
        // Process partials if templateRegister function is provided
        if (this.templateRegister && Object.keys(partials).length > 0) {
          try {
            for (const [name, template] of Object.entries(partials)) {
              this.templateRegister(name, template);
            }
          } catch (err) {
            console.warn('⚠️  Could not register partials:', err.message);
          }
        }
        
        // Live reload script to inject in development mode
        
        
        for (const fileName of fileNames) {
          const view = views[fileName];
          if (!view || !view.template) continue;
          
          const res = this.templateCompiler(view.template, {...view.data, fileName, fileNames});
          let renderedContent = isPromise(res) ? await res : res;
          
          // Inject live reload script before the last </body> tag if in development mode
          if (this.mode === 'development' && renderedContent.includes('</body>')) {
            const lastBodyIndex = renderedContent.lastIndexOf('</body>');
            if (lastBodyIndex !== -1) {
              renderedContent = renderedContent.substring(0, lastBodyIndex) + 
                              liveReloadScript() + '\n' + 
                              renderedContent.substring(lastBodyIndex);
            }
          }
          this.#compiledTemplates.set(fileName, renderedContent);
        }
        
        // Convert Map to object for return
        const result = {};
        for (const [key, value] of this.#compiledTemplates) {
          result[key] = value;
        }
        return result;
      }
    }
  }
}