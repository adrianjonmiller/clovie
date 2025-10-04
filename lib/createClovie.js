import { Engine } from '@brickworks/engine';
import { ClovieConfig } from './ClovieConfig.js';
import { File } from './File.js';
import { Compile } from './Compile.js';
import { Run } from './Run.js';
import { Cache } from './Cache.js';

export const createClovie = async (config = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const clovie = Engine.create().install(
        ClovieConfig.configure(config),
        File,
        Compile, 
        Run,
        Cache,
      );
  
      clovie.clovieConfig.onReady(async (clovieConfig) => {
    
        if (clovieConfig.mode === 'development' || clovieConfig.type === 'server') {
          const { Server } = await import('./Server.js');
          console.log('🌐 Installing Server');
          clovie.install(Server);
          console.log('🌐 Server installed');
        }
  
        if (clovieConfig.mode === 'development') {
          const { LiveReload } = await import('./LiveReload.js');
          console.log('🌐 Installing LiveReload');
          clovie.install(LiveReload);
          console.log('🌐 LiveReload installed');
        }

        if (clovieConfig.mode === 'development') {
          clovie.run.dev();
        }
  
        resolve(clovie);
      });
    } catch (error) {
      reject({ error, code: 'CREATE_CLOVIE_ERROR' });
    }
  });
}
