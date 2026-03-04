import { ServiceProvider } from '@jucie.io/engine';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { pathToFileURL } from 'url';
import { PageCache } from './Cache.js';
import { File } from './File.js';
import { createProgressTracker } from './utils/progress.js';

export class Apps extends ServiceProvider {
  static manifest = {
    name: 'Clovie Apps',
    namespace: 'apps',
    version: '1.0.0',
    dependencies: [PageCache, File],
    defaults: {
      apps: []
    }
  };

  #progressTracker = null;
  #buildProcesses = new Map();
  #buildResults = new Map();
  #handlers = new Map();
  #apps = [];

  actions(useContext) {
    const log = useContext('log');
  
    
    return {
      build: async (opts = {}) => {
        this.#apps = opts.apps || [];
        try {

          for (const app of this.#apps) {
            const { default: config } = await import(app.config);
            await this.createViteApp(opts, config);
          }

          return true
          
        } catch (error) {
          console.error('Error building apps', error);
        }
        return true
      }
    };
  }

  async createViteApp(opts = {}, config = {}) {
    const [server, log] = this.useContext('server', 'log');
    const { createServer } = await import('vite');
    const vite = await createServer({
      httpServer: server.getHttpServer(),
      root: opts.root,
      configFile: opts.configFile
    });
    
    // server.add('GET', '/vite', async (ctx) => {
    //   const url = ctx.req.originalUrl;
    //   const template = await vite.transformIndexHtml(url, fs.readFileSync(join(opts.root, 'index.html'), 'utf-8'));
    //   return ctx.respond.html(template);
    // })
  }
}