import { replaceRouteParams, parseRouteParams, generateRoutes, validateParam, transformParam } from './routeParams.js';

/**
 * Route utilities for Clovie's dynamic routing system
 */

/**
 * Process routes with dynamic parameters
 * @param {Array} routes - Array of route configurations
 * @param {Object} context - Context object with state and data access
 * @returns {Array} - Array of resolved routes with generated paths
 */
export function processRoutes(routes, context) {
  const processedRoutes = [];
  
  for (const route of routes) {
    if (route.repeat) {
      // Dynamic route generation
      const items = route.repeat(context.state || context);
      const paramSets = Array.isArray(items) ? items : [items];
      
      for (const item of paramSets) {
        // Extract parameters from the item
        const params = extractParamsFromItem(item, route);
        
        // Generate the actual path
        const actualPath = replaceRouteParams(route.path, params, {
          strict: false,
          encode: true
        });
        
        // Get route-specific data
        const routeData = route.data ? route.data(context.state || context, item, params) : {};
        
        processedRoutes.push({
          ...route,
          actualPath,
          params,
          item,
          data: routeData
        });
      }
    } else {
      // Static route
      const actualPath = replaceRouteParams(route.path, {}, { strict: false });
      const routeData = route.data ? route.data(context.state || context) : {};
      
      processedRoutes.push({
        ...route,
        actualPath,
        params: {},
        data: routeData
      });
    }
  }
  
  return processedRoutes;
}

/**
 * Extract parameters from an item for route generation
 * @param {Object} item - The data item
 * @param {Object} route - The route configuration
 * @returns {Object} - Extracted parameters
 */
function extractParamsFromItem(item, route) {
  const params = {};
  const routeParams = parseRouteParams(route.path);
  
  for (const param of routeParams) {
    const { name } = param;
    
    // Try different property access patterns
    if (item[name] !== undefined) {
      params[name] = item[name];
    } else if (item[`${name}Slug`] !== undefined) {
      params[name] = item[`${name}Slug`];
    } else if (item.slug !== undefined && name === 'slug') {
      params[name] = item.slug;
    } else if (item.id !== undefined && name === 'id') {
      params[name] = item.id;
    } else {
      // Generate parameter from other item properties
      params[name] = generateParamFromItem(item, name);
    }
  }
  
  return params;
}

/**
 * Generate a parameter value from an item's properties
 * @param {Object} item - The data item
 * @param {string} paramName - The parameter name
 * @returns {string} - Generated parameter value
 */
function generateParamFromItem(item, paramName) {
  // Common generation strategies
  if (item.title) {
    return slugify(item.title);
  }
  
  if (item.name) {
    return slugify(item.name);
  }
  
  if (item.id) {
    return String(item.id);
  }
  
  if (item.slug) {
    return item.slug;
  }
  
  // Fallback to a generic slug
  return slugify(JSON.stringify(item));
}

/**
 * Convert text to URL-friendly slug
 * @param {string} text - Text to convert
 * @returns {string} - URL-friendly slug
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate route parameters against expected types
 * @param {Object} params - Parameters to validate
 * @param {Object} route - Route configuration with parameter types
 * @returns {Object} - Validation result
 */
export function validateRouteParams(params, route) {
  const errors = [];
  const warnings = [];
  
  if (route.paramTypes) {
    for (const [paramName, paramType] of Object.entries(route.paramTypes)) {
      const value = params[paramName];
      
      if (value !== undefined) {
        if (!validateParam(value, paramType)) {
          errors.push(`Invalid ${paramName}: ${value} does not match expected format`);
        }
      } else if (!route.paramTypes[paramName].optional) {
        errors.push(`Missing required parameter: ${paramName}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Transform route parameters according to their types
 * @param {Object} params - Raw parameters
 * @param {Object} route - Route configuration with parameter types
 * @returns {Object} - Transformed parameters
 */
export function transformRouteParams(params, route) {
  const transformed = { ...params };
  
  if (route.paramTypes) {
    for (const [paramName, paramType] of Object.entries(route.paramTypes)) {
      if (transformed[paramName] !== undefined) {
        transformed[paramName] = transformParam(transformed[paramName], paramType);
      }
    }
  }
  
  return transformed;
}

/**
 * Route parameter types for common use cases
 */
export const commonParamTypes = {
  slug: 'slug',
  id: 'id',
  uuid: 'uuid',
  date: 'date'
};

/**
 * Create a route configuration with parameter validation
 * @param {Object} config - Route configuration
 * @returns {Object} - Enhanced route configuration
 */
export function createRoute(config) {
  return {
    ...config,
    paramTypes: config.paramTypes || {},
    validate: function(params) {
      return validateRouteParams(params, this);
    },
    transform: function(params) {
      return transformRouteParams(params, this);
    }
  };
}
