import { Engine } from '@brickworks/engine';

import { Compile } from './Compile.js';
import { Run } from './Run.js';
import { Configurator } from './Configurator.js';
import { Route } from './Server/Router.js';
import { transformConfig } from './utils/transformConfig.js';

export const createClovie = async (config = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const clovie = Engine.create().install(
        Configurator.configure({
          optsPath: config.optsPath,
          transform: transformConfig
        }),
      );
  
      clovie.configurator.onReady(async (opts) => {
        // Always install core services
        clovie.install(Compile)
        clovie.install(Route)
        clovie.install(Run)

        if (opts.type === 'server') {
          const { Database } = await import('@brickworks/database-ext');
          clovie.install(Database.configure({
            dbPath: opts.dbPath,
            walPath: opts.walPath,
          }));
        }
        
        // Conditionally install services based on mode/type
        if (opts.type === 'server' || opts.mode === 'development') {
          const { Server } = await import('./Server/Server.js');
          clovie.install(Server);
        }
  
        if (opts.mode === 'development') {
          const { LiveReload } = await import('./LiveReload.js');
          clovie.install(LiveReload);
        }

        // Don't auto-execute commands - let CLI decide
        resolve(clovie);
      });
    } catch (error) {
      reject({ error, code: 'CREATE_CLOVIE_ERROR' });
    }
  });
}
