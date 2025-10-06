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
        // Always install core services
        clovie.install(Compile.configure(clovieConfig))
        clovie.install(Run.configure(clovieConfig))
        
        // Conditionally install services based on mode/type
        if (clovieConfig.type === 'server' || clovieConfig.mode === 'development') {
          const { Server } = await import('./Server.js');
          clovie.install(Server.configure(clovieConfig));
        }
  
        if (clovieConfig.mode === 'development') {
          const { LiveReload } = await import('./LiveReload.js');
          clovie.install(LiveReload.configure(clovieConfig));
        }

        // Don't auto-execute commands - let CLI decide
        resolve(clovie);
      });
    } catch (error) {
      reject({ error, code: 'CREATE_CLOVIE_ERROR' });
    }
  });
}
