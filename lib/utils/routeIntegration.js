/**
 * Integration utilities for Clovie's routing system
 */

import { replaceRouteParams, parseRouteParams } from './routeParams.js';
import { processRoutes } from './routeUtils.js';

/**
 * Integrate route processing with Clovie's build system
 * @param {Array} routes - Route configurations from clovie.config.js
 * @param {Object} context - Clovie context with state access
 * @returns {Array} - Processed routes ready for file generation
 */
export function processClovieRoutes(routes, context) {
  if (!routes || !Array.isArray(routes)) {
    return [];
  }
  
  return processRoutes(routes, context).map(route => ({
    // File path for output
    outputPath: route.actualPath.endsWith('.html') ? route.actualPath : `${route.actualPath}/index.html`,
    
    // Template path
    templatePath: route.template,
    
    // Data for template compilation
    templateData: route.data,
    
    // Route metadata
    routeName: route.name,
    routePath: route.path,
    params: route.params,
    item: route.item
  }));
}

/**
 * Generate route files for static build
 * @param {Array} processedRoutes - Routes processed by processClovieRoutes
 * @param {Function} compileTemplate - Template compilation function
 * @param {Function} writeFile - File writing function
 * @param {string} outputDir - Output directory
 */
export async function generateRouteFiles(processedRoutes, compileTemplate, writeFile, outputDir) {
  const results = [];
  
  for (const route of processedRoutes) {
    try {
      // Compile template with route data
      const compiledContent = compileTemplate(route.templatePath, route.templateData);
      
      // Write to output directory
      const fullOutputPath = `${outputDir}${route.outputPath}`;
      await writeFile(fullOutputPath, compiledContent);
      
      results.push({
        success: true,
        route: route.routeName,
        path: route.outputPath,
        outputPath: fullOutputPath
      });
      
      console.log(`✅ Generated route: ${route.outputPath}`);
      
    } catch (error) {
      results.push({
        success: false,
        route: route.routeName,
        path: route.outputPath,
        error: error.message
      });
      
      console.error(`❌ Failed to generate route ${route.outputPath}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Simple route parameter replacement for quick use
 * @param {string} path - Route path template
 * @param {Object} params - Parameter values
 * @returns {string} - Resolved path
 */
export function resolveRoute(path, params = {}) {
  return replaceRouteParams(path, params, {
    strict: false,
    encode: true
  });
}

/**
 * Extract route parameters from a URL
 * @param {string} routePath - Route path template
 * @param {string} url - Actual URL
 * @returns {Object|null} - Extracted parameters or null if no match
 */
export function extractRouteParams(routePath, url) {
  const regexPattern = routePath
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*\?/g, '(?:/([^/]+))?')
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '/([^/]+)')
    .replace(/\//g, '\\/');
  
  const regex = new RegExp(`^${regexPattern}$`);
  const match = url.match(regex);
  
  if (!match) return null;
  
  const paramNames = parseRouteParams(routePath).map(p => p.name);
  const params = {};
  
  for (let i = 0; i < paramNames.length; i++) {
    const value = match[i + 1];
    if (value !== undefined) {
      params[paramNames[i]] = decodeURIComponent(value);
    }
  }
  
  return params;
}

/**
 * Common route patterns for quick reference
 */
export const routePatterns = {
  // Simple patterns
  slug: '/:slug',
  id: '/:id',
  
  // Nested patterns
  categorySlug: '/category/:slug',
  productSlug: '/products/:slug',
  userProfile: '/users/:id',
  
  // Complex patterns
  blogPost: '/blog/:category/:slug',
  userPost: '/users/:id/posts/:postId',
  archive: '/archive/:year/:month?/:day?',
  
  // API patterns
  apiResource: '/api/:resource/:id?',
  apiAction: '/api/:resource/:id/:action'
};

/**
 * Helper to create common route configurations
 */
export const routeHelpers = {
  /**
   * Create a simple slug-based route
   */
  slugRoute: (basePath, template, dataSource) => ({
    path: `${basePath}/:slug`,
    template,
    repeat: dataSource,
    data: (state, item, params) => ({
      ...state.get(),
      item,
      slug: params.slug
    })
  }),
  
  /**
   * Create an ID-based route
   */
  idRoute: (basePath, template, dataSource) => ({
    path: `${basePath}/:id`,
    template,
    repeat: dataSource,
    data: (state, item, params) => ({
      ...state.get(),
      item,
      id: params.id
    })
  }),
  
  /**
   * Create a nested route (e.g., /users/:id/posts/:postId)
   */
  nestedRoute: (parentPath, parentParam, childPath, childParam, template, dataSource) => ({
    path: `${parentPath}/:${parentParam}/${childPath}/:${childParam}`,
    template,
    repeat: dataSource,
    data: (state, item, params) => ({
      ...state.get(),
      item,
      [parentParam]: params[parentParam],
      [childParam]: params[childParam]
    })
  })
};
