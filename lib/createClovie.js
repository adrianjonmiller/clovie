import { Engine } from '@brickworks/engine';
import { File } from './File.js';
import { Compiler } from './Compiler.js';
import { Views } from './Views.js';
import { Build } from './Build.js';
import { Server } from './Server.js';
import { Cache } from './Cache.js';
import { discoverProjectStructure } from './utils/discover.js';

export const createClovie = async (config) => {
  // Auto-discover project structure and merge with user config
  const discoveredConfig = await discoverProjectStructure(config);
  
  const clovie = Engine.create(config).install(
    File,
    Compiler,
    Views,
    Cache,
    Build,
    Server
  );

  return clovie;
}
