import { Engine } from '@jucie.io/engine';

import { Compile } from './Compile.js';
import { Run } from './Run.js';
import { Configurator } from './Configurator.js';
import { Route } from './Server/Router.js';
import { transformConfig } from './utils/transformConfig.js';
import { Apps } from './Apps.js';
import { Server } from './Server/Server.js';
import { LiveReload } from './LiveReload.js';

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

        if (opts.apps) {
          clovie.install(Apps);
        }

        if (opts.type === 'server' || opts.mode === 'development') {
          clovie.install(Server);
        }
  
        if (opts.mode === 'development') {
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
