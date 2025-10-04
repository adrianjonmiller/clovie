import { ServiceProvider } from '@brickworks/engine';
import path from 'path';
import { ClovieConfig } from './ClovieConfig.js';

export class Compile extends ServiceProvider {

  static manifest = {
    name: 'Clovie Compile',
    namespace: 'compile',
    version: '1.0.0',
    dependencies: [ClovieConfig]
  };

  actions(useContext) {
    return {
      assets:  (assetMap) => {
        const promises = [];

        for (const [path, content] of Object.entries(assetMap)) {
          promises.push(this.#asset(path, content));
        }

        return Promise.all(promises);
      },
      scripts:  (scriptMap) => {
        const promises = [];

        for (const [path, content] of Object.entries(scriptMap)) {
          promises.push(this.#script(path, content));
        }

        return Promise.all(promises);
      },
      styles:  (styleMap) => {
        const promises = [];

        for (const [path, content] of Object.entries(styleMap)) {
          promises.push(this.#style(path, content));
        }

        return Promise.all(promises);
      },
      partials:  (partialMap) => {
        const promises = [];

        for (const [path, content] of Object.entries(partialMap)) {
          promises.push(this.#loadPartial(path, content));
        }

        return Promise.all(promises);
      },
      templates:  (templateMap) => {
        const promises = [];

        for (const [path, content] of Object.entries(templateMap)) {
          promises.push(this.#template(path, content));
        }

        return Promise.all(promises);
      },
      asset:  (path, outputDir) => this.#asset(path, outputDir ),
      script:  (path, outputDir) => this.#script(path, outputDir), 
      style:  (path, outputDir) => this.#style(path, outputDir),
      partial:  (path, content) => this.#loadPartial(path, content),
      template: (path, content, outputDir) => this.#template(path, content, outputDir),
    };
  }

  async #asset(filePath, content) {
    const [stable, clovieConfig] = this.useContext('stable', 'clovieConfig');

    if (content) {
      const assetsDir = clovieConfig.get('assets');
      const relativePath = path.relative(assetsDir, filePath);
      
      console.log(`📁 Processing asset: ${filePath}`);
      
      // Cache the asset content
      stable.set(['assets', filePath], {
        content,
        relativePath,
        timeStamp: Date.now(),
      });
      
      console.log(`✅ Asset processed: ${relativePath}`);
      return [relativePath, content];
    }
  }

  async #script(filePath, content) {
    const [stable, clovieConfig] = this.useContext('stable', 'clovieConfig');

    if (content) {
      const scriptsDir = clovieConfig.get('scripts');
      const fileName = path.basename(filePath);
      const relativePath = path.relative(scriptsDir, filePath);

      if (clovieConfig.has('scriptCompiler')) {
        try {
          console.log(`🔧 Using configured script compiler for: ${filePath}`);
          // Use the configured script compiler
          const compiled = await clovieConfig.get('scriptCompiler')(content, filePath);
          
          // Cache the compiled result
          stable.set(['scripts', filePath], {
            compiled,
            timeStamp: Date.now(),
          });
          
          console.log(`✅ Script compiled successfully: ${fileName}`);
          return [relativePath, compiled];
        } catch (err) {
          console.warn(`⚠️  Script compilation failed for ${filePath}: ${err.message}`);
          // Cache the error
          stable.set(['scripts', filePath], {
            error: err.message,
            timeStamp: Date.now(),
          });
          return content; // Fallback to raw content
        }
      } else {
        console.log(`⚠️  No script compiler configured, using raw file: ${fileName}`);
        // No script compiler configured, cache raw content
        stable.set(['scripts', filePath], {
          compiled: content,
          timeStamp: Date.now(),
        });
        return content;
      }
    }
  }

  async #style(filePath, content) {
    const [stable, clovieConfig] = this.useContext('stable', 'clovieConfig');

    if (content) {
      const stylesDir = clovieConfig.get('styles');
      const relativePath = path.relative(stylesDir, filePath).replace(/\.(scss|sass|less|styl)$/, '.css');
      const fileName = path.basename(relativePath);

      if (clovieConfig.has('styleCompiler')) {
        try {
          console.log(`🎨 Using configured style compiler for: ${filePath}`);
          // Use the configured style compiler
          const compiled = await clovieConfig.get('styleCompiler')(content, filePath);
          
          // Cache the compiled result
          stable.set(['styles', filePath], {
            compiled,
            timeStamp: Date.now(),
          });
          
          console.log(`✅ Style compiled successfully: ${fileName}`);
          return [relativePath, compiled];
        } catch (err) {
          console.warn(`⚠️  Style compilation failed for ${filePath}: ${err.message}`);
          // Cache the error
          stable.set(['styles', filePath], {
            error: err.message,
            timeStamp: Date.now(),
          });
          return [relativePath, content]; // Fallback to raw content
        }
      } else {
        console.log(`⚠️  No style compiler configured, using raw file: ${fileName}`);
        // No style compiler configured, cache raw content
        stable.set(['styles', filePath], {
          compiled: content,
          timeStamp: Date.now(),
        });
        return content;
      }
    }
  }

  #loadPartial(filePath, partial) {
    try {
      const clovieConfig = this.useContext('clovieConfig');
      const partialsDir = clovieConfig.get('partials');
      const relativePath = path.relative(partialsDir, filePath);
      
      // Get the partial name without extension (e.g., 'header.html' -> 'header')
      const partialName = path.parse(relativePath).name;
      
      // Get the template register function
      const templateRegister = clovieConfig.get('templateRegister') || clovieConfig.get('register');
      
      if (templateRegister) {
        templateRegister(partialName, partial);
        console.log(`✅ Registered partial: ${partialName}`);
      } else {
        console.warn('⚠️  No template register function available');
      }
      
      return Promise.resolve();
    } catch (err) {
      console.warn('⚠️  Could not register partials:', err.message);
    }
  }

  async #template(filePath, content) {
    const [stable, clovieConfig, liveReload] = this.useContext('stable', 'clovieConfig', 'liveReload');

    if (content) {
      const fileName = path.basename(filePath);
      const viewsDir = clovieConfig.get('views');
      const relativePath = path.relative(viewsDir, filePath);
      
      console.log(`📄 Processing template: ${filePath}`);
      
      try {
        // Get template compiler
        const templateCompiler = clovieConfig.get('templateCompiler') || clovieConfig.get('compiler');
        
        if (templateCompiler) {
          // Get global data from stable storage
          const globalData = stable.get(['data']) || {};
          
          // Compile template with data
          let renderedContent = templateCompiler(content, globalData);
          
          // Inject live reload script if in development mode
          const config = clovieConfig.get();

          if (liveReload && renderedContent.includes('</body>')) {
            console.log('🔄 Injecting live reload script');
            renderedContent = await liveReload.injectLiveReloadScript(renderedContent, config);
          }
          
          // Cache the compiled result
          stable.set(['templates', filePath], {
            compiled: renderedContent,
            timeStamp: Date.now(),
          });

          console.log(`✅ Template compiled successfully: ${fileName}`);
          return [relativePath, renderedContent];
        } else {
          console.warn(`⚠️  No template compiler configured for: ${filePath}`);
          return [relativePath, content];
        }
      } catch (err) {
        console.warn(`⚠️  Template compilation failed for ${filePath}: ${err.message}`);
        // Cache the error
        stable.set(['templates', filePath], {
          error: err.message,
          timeStamp: Date.now(),
        });
        return content; // Fallback to raw content
      }
    }

    return [filePath, content];
  }
}
