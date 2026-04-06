import { Engine } from '@jucie.io/engine';

import { Compile } from './services/Compile.js';
import { Run } from './services/Run.js';
import { Configurator } from './services/Configurator.js';
import { transformConfig } from './utils/transformConfig.js';
import { Server } from '@jucie.io/engine-server';
import { EsBuildCompiler } from '@jucie.io/engine-esbuild';
import { LiveReload } from './services/LiveReload.js';

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
        clovie.install(Run)

        if (opts.scripts) {
          clovie.install(EsBuildCompiler.configure({
            entryPoints: [`${opts.scripts}/**/*.js`],
            outdir: opts.outputDir,
            outbase: opts.scripts,
            bundle: true,
            format: 'iife',
            target: 'es2015',
            minify: opts.mode === 'production',
            sourcemap: opts.mode === 'development',
          }));
        }

        if (typeof opts.setup === 'function') {
          await opts.setup(clovie);
        }

        if (opts.type === 'server' || opts.mode === 'development') {
          clovie.install(Server);
        }
  
        if (opts.mode === 'development') {
          clovie.install(LiveReload);
        }

        if (Array.isArray(opts.services)) {
          for (const service of opts.services) {
            if (service.configured) {
              clovie.install(service);
            } else {
              clovie.install(service.configure(opts));
            }
          }
        }

        // Don't auto-execute commands - let CLI decide
        resolve(clovie);
      });
    } catch (error) {
      reject({ error, code: 'CREATE_CLOVIE_ERROR' });
    }
  });
}
