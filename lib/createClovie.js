import { Engine } from '@brickworks/engine';
import { Config } from './Config.js';
import { File } from './File.js';
import { Compiler } from './Compiler.js';
import { Views } from './Views.js';
import { Routes } from './Routes.js';
import { Build } from './Build.js';
import { Server } from './Server.js';
import { Cache } from './Cache.js';

export const createClovie = async (config = {}) => {
  // Step 1: Run discovery first to get the full configuration
  const discoveredConfig = await Config.discover(config);
  
  // Step 2: Create engine with discovered config and install all services
  // Determine if we need the server (for development/watch mode or server type)
  const needsServer = discoveredConfig.mode === 'development' || 
                      process.argv.includes('watch') || 
                      process.argv.includes('server') ||
                      discoveredConfig.type === 'server';
  
  // All services including Config (for CLI access to discovered config)
  const baseServices = [
    Config, // Include Config service for CLI access
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
  
  const clovie = Engine.create(discoveredConfig).install(...baseServices);
  
  return clovie;
}
