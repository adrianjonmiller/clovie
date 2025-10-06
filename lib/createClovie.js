import { Engine } from '@brickworks/engine';
import { Compile } from './Compile.js';
import { Run } from './Run.js';
import { Configurator } from './Configurator.js';
import { transformConfig } from './utils/transformConfig.js';

export const createClovie = async (config = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const clovie = Engine.create().install(
        Configurator.configure({
          configPath: config.configPath,
          transform: transformConfig
        }),
      );
  
      clovie.configurator.onReady(async (clovieConfig) => {
        clovie.install(Compile.configure(clovieConfig))
        clovie.install(Run.configure(clovieConfig))
        
    
        if (clovieConfig.mode === 'development' || clovieConfig.type === 'server') {
          const { Server } = await import('./Server.js');
          clovie.install(Server.configure(clovieConfig));
        }
  
        if (clovieConfig.mode === 'development') {
          const { LiveReload } = await import('./LiveReload.js');
          clovie.install(LiveReload.configure(clovieConfig));
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
