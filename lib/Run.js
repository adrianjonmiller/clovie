import { ServiceProvider } from '@brickworks/engine';
import path from 'path';

export class Run extends ServiceProvider {
  static manifest = {
    name: 'Run',
    namespace: 'run',
  };

  actions(useContext) {
    return {
      build: async (name) => {
        
      },
      serve: (name) => {
        console.log('🔄 Creating', name);
      },
      dev: async () => {
        const [ clovieConfig, relay, liveReload ] = useContext('clovieConfig', 'relay', 'liveReload')
        await this.#build();
        await this.#devServer();
        await this.#watch();

        relay.from(clovieConfig).subscribe('reload', async (config) => {
          await this.#build();
          liveReload.notifyReload();
        }); 
      }
    }
  }

  #devServer() {
    this.useContext('server')?.start();
  }

  async #build() {
    const [file, compile, clovieConfig, cache] = this.useContext('file', 'compile', 'clovieConfig', 'cache');
    file.clean(clovieConfig.get('outputDir'));
    
    compile.partials(file.buildFileMap(clovieConfig.get('partials')))
    const assetsMap = file.buildFileMap(clovieConfig.get('assets'));
    const scriptsMap = file.buildFileMap(clovieConfig.get('scripts'));
    const stylesMap = file.buildFileMap(clovieConfig.get('styles'));
    const templatesMap = file.buildFileMap(clovieConfig.get('views'));
    
    const compiled = await Promise.all([
      compile.assets(assetsMap),
      compile.scripts(scriptsMap),
      compile.styles(stylesMap),
      compile.templates(templatesMap),
    ]);

    for (const dataSet of compiled) {
      for (const [filePath, content] of dataSet) {
        const outputPath = path.join(clovieConfig.get('outputDir'), filePath);
        
        // Cache based on OUTPUT content (handles both template and data changes)
        if (cache.shouldWrite(outputPath, content)) {
          file.write(outputPath, content);
          cache.set(outputPath, content);
          console.log(`✅ Written: ${filePath}`);
        } else {
          console.log(`⏭️  Skipped (no changes): ${filePath}`);
        }
      }
    }

    return true;
  }

  async #watch() {
    console.log('🔄 Watching for changes...');
    const [file, compile, clovieConfig, liveReload, cache] = this.useContext('file', 'compile', 'clovieConfig', 'liveReload', 'cache');

    file.watch(clovieConfig.get('assets'), async () => {
      const compiled = await compile.assets(file.buildFileMap(clovieConfig.get('assets')))
      let hasUpdates = false;
      
      for (const [filePath, content] of compiled) {
        const outputPath = path.join(clovieConfig.get('outputDir'), filePath);
        
        if (cache.shouldWrite(outputPath, content)) {
          file.write(outputPath, content);
          cache.set(outputPath, content);
          console.log(`✅ Asset updated: ${filePath}`);
          hasUpdates = true;
        }
      }
      
      if (hasUpdates) {
        liveReload.notifyReload();
      }
    })

    file.watch(clovieConfig.get('scripts'), async () => {
      const compiled = await compile.scripts(file.buildFileMap(clovieConfig.get('scripts')))
      let hasUpdates = false;
      
      for (const [filePath, content] of compiled) {
        const outputPath = path.join(clovieConfig.get('outputDir'), filePath);
        
        if (cache.shouldWrite(outputPath, content)) {
          file.write(outputPath, content);
          cache.set(outputPath, content);
          console.log(`✅ Script updated: ${filePath}`);
          hasUpdates = true;
        }
      }
      
      if (hasUpdates) {
        liveReload.notifyReload();
      }
    })

    file.watch(clovieConfig.get('partials'), async () => {
      console.log('🔄 Partial changed, recompiling all templates...');
      
      await compile.partials(file.buildFileMap(clovieConfig.get('partials')))
      const compiled = await compile.templates(file.buildFileMap(clovieConfig.get('views')))
      let hasUpdates = false;
      
      for (const [filePath, content] of compiled) {
        const outputPath = path.join(clovieConfig.get('outputDir'), filePath);
        
        if (cache.shouldWrite(outputPath, content)) {
          file.write(outputPath, content);
          cache.set(outputPath, content);
          console.log(`✅ Template updated: ${filePath}`);
          hasUpdates = true;
        }
      }
      
      if (hasUpdates) {
        liveReload.notifyReload();
      }
    });
    
    console.log('🔄 Watching for views...', clovieConfig.get('views'));

    file.watch(clovieConfig.get('views'), async (filePath, content) => {
      console.log('🔄 View changed, recompiling...');
      const [fileOutputPath, compiled] = await compile.template(filePath, content);
      const outputPath = path.join(clovieConfig.get('outputDir'), fileOutputPath);
      
      // Cache based on OUTPUT content (handles both template and data changes)
      if (cache.shouldWrite(outputPath, compiled)) {
        file.write(outputPath, compiled);
        cache.set(outputPath, compiled);
        console.log(`✅ Template updated: ${filePath}`);
        liveReload.notifyReload();
      } else {
        console.log(`⏭️  Template unchanged: ${filePath}`);
      }
    })
  }

  async #buildAssets() {
    const [file, compile, clovieConfig] = this.useContext('file', 'compile', 'clovieConfig', 'server');
    const assetsMap = file.buildFileMap(clovieConfig.get('assets'));
    const compiled = await compile.assets(assetsMap);
    for (const [filePath, content] of compiled) {
      const outputPath = path.join(clovieConfig.get('outputDir'), filePath);
      file.write(outputPath, content);
    }
  }
}