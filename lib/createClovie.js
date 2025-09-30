import { Engine } from '@brickworks/engine';
import { File } from './File.js';
import { Compiler } from './Compiler.js';
import { Views } from './Views.js';
import { Routes } from './Routes.js';
import { Build } from './Build.js';
import { Server } from './Server.js';
import { Cache } from './Cache.js';
import { discoverProjectStructure } from './utils/discover.js';

export const createClovie = async (config) => {
  // Auto-discover project structure and merge with user config
  const discoveredConfig = await discoverProjectStructure(config);
  
  // Determine if we need the server (for development/watch mode or server type)
  const needsServer = discoveredConfig.mode === 'development' || 
                      process.argv.includes('watch') || 
                      process.argv.includes('server') ||
                      discoveredConfig.type === 'server';
  
  // Base services that are always needed
  const baseServices = [
    File,
    Compiler,
    Views,
    Routes,
    Cache,
    Build
  ];
  
  // Add server only if needed
  if (needsServer) {
    baseServices.push(Server);
  }
  
  const clovie = Engine.create(config).install(...baseServices);

  return clovie;
}
