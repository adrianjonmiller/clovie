#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Generate TypeScript definitions for Clovie
const typeDefinitions = `// Type definitions for Clovie
// Project: https://github.com/adrianjonmiller/clovie
// Definitions by: Adrian Miller <code.mill@fastmail.com>

export interface ClovieConfig {
  /** Project type - 'static' for static site generation, 'server' for Express applications */
  type?: 'static' | 'server';
  
  /** Views directory path */
  views?: string;
  
  /** Partials directory path */
  partials?: string;
  
  /** Scripts entry point or directory */
  scripts?: string;
  
  /** Styles entry point or directory */
  styles?: string;
  
  /** Assets directory path */
  assets?: string;
  
  /** Output directory for built files */
  outputDir?: string;
  
  /** Development server port */
  port?: number;
  
  /** Template compiler function */
  templateCompiler?: (template: string, data: any) => string | Promise<string>;
  
  /** Template compiler function (legacy alias) */
  compiler?: (template: string, data: any) => string | Promise<string>;
  
  /** Template register function for partials */
  templateRegister?: (name: string, template: string) => void;
  
  /** Template register function (legacy alias) */
  register?: (name: string, template: string) => void;
  
  /** Script compiler function */
  scriptCompiler?: (content: string, filePath: string) => string | Promise<string>;
  
  /** Style compiler function */
  styleCompiler?: (content: string, filePath: string) => string | Promise<string>;
  
  /** Data for site generation */
  data?: any | (() => any | Promise<any>);
  
  /** Routes configuration for dynamic pages */
  routes?: RouteConfig[];
  
  /** API routes configuration (server mode only) */
  api?: ApiRouteConfig[];
  
  /** Express middleware (server mode only) */
  middleware?: any[];
  
  /** Development mode flag */
  mode?: 'development' | 'production';
  
  /** Enable file watching */
  watch?: boolean;
  
  /** Open browser automatically */
  open?: boolean;
}

export interface RouteConfig {
  /** Route name for identification */
  name?: string;
  
  /** URL path pattern (supports parameters like :slug) */
  path: string;
  
  /** Template file to use for rendering */
  template: string;
  
  /** HTTP method (default: 'GET') */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /** Function to repeat route for multiple data items */
  repeat?: (state: any) => any[];
  
  /** Data transformation function */
  data?: (state: any, item?: any, pageInfo?: PaginationInfo) => any;
  
  /** Pagination settings */
  paginate?: number;
  
  /** Express route handler (server mode only) */
  handler?: (req: any, res: any) => void | Promise<void>;
}

export interface ApiRouteConfig {
  /** URL path pattern */
  path: string;
  
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /** Express route handler */
  handler: (req: any, res: any) => void | Promise<void>;
}

export interface PaginationInfo {
  /** Current page number (1-based) */
  current: number;
  
  /** Total number of pages */
  total: number;
  
  /** Items per page */
  perPage: number;
  
  /** Total number of items */
  totalItems: number;
  
  /** Whether there is a previous page */
  hasPrev: boolean;
  
  /** Whether there is a next page */
  hasNext: boolean;
  
  /** Previous page number (null if no previous page) */
  prev: number | null;
  
  /** Next page number (null if no next page) */
  next: number | null;
}

export interface ClovieInstance {
  /** Build service for static site generation */
  build: {
    static(): Promise<BuildResult>;
  };
  
  /** Server service for Express applications */
  server?: {
    start(): void;
    stop(): void;
  };
  
  /** File service for file operations */
  file: {
    readFile(path: string): string | Buffer | null;
    write(files: Record<string, string | Buffer>, outputDir: string): string;
    exists(path: string): boolean;
    readNames(path: string): string[];
    createDirectory(path: string): boolean;
    watch(paths: string | string[], options?: any): any[];
    stopWatching(): void;
    isWatching(): boolean;
    getFileName(path: string): string;
    getFileExtension(path: string): string;
    getBaseName(path: string): string;
  };
  
  /** Compiler service for template compilation */
  compiler: {
    templates(views: Record<string, ViewData>, partials?: Record<string, string>): Promise<Record<string, string>>;
  };
  
  /** Views service for view processing */
  views: {
    process(viewsDir: string, partialsDir?: string | null, data?: any): Promise<ViewsResult>;
  };
  
  /** Routes service for route management */
  routes: {
    generateRoutes(): Promise<RouteConfig[]>;
    processRoutes(routes: RouteConfig[]): Promise<RoutesResult>;
    setupServerRoutes(app: any): Promise<void>;
  };
  
  /** Cache service for build caching */
  cache: {
    getFileHash(path: string): string | null;
    hasChanged(path: string): boolean;
    getChangedFiles(files: string[]): string[];
    markBuilt(): void;
    getBuildStats(): BuildStats;
    clear(): void;
    load(): any;
    save(): void;
  };
  
  /** State management */
  state: any;
  stable: any;
}

export interface ViewData {
  template: string;
  data: any;
}

export interface ViewsResult {
  pages: Record<string, ViewData>;
  partials: Record<string, string>;
}

export interface RoutesResult {
  pages: Record<string, ViewData>;
  partials: Record<string, string>;
}

export interface BuildResult {
  success: boolean;
  buildTime: number;
  filesGenerated: number;
  isIncremental: boolean;
  changedFiles: number;
}

export interface BuildStats {
  totalFiles: number;
  changedFiles: number;
  lastBuild: number | null;
  totalBuilds: number;
}

/**
 * Create a new Clovie instance with the given configuration
 */
export declare function createClovie(config?: ClovieConfig): Promise<ClovieInstance>;

export default createClovie;
`;

// Write the type definitions
const typesPath = join(rootDir, 'dist', 'index.d.ts');
writeFileSync(typesPath, typeDefinitions, 'utf8');

console.log('✅ TypeScript definitions generated at dist/index.d.ts');
