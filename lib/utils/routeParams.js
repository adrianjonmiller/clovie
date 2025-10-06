/**
 * Route parameter utilities for handling dynamic routes
 * Supports common parameter syntax patterns
 */

/**
 * Parse route parameters from a route path
 * @param {string} routePath - The route path (e.g., '/products/:slug', '/users/:id/posts/:postId')
 * @returns {Array} Array of parameter objects with name, type, and optional info
 */
export function parseRouteParams(routePath) {
  const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)(\?)?(\*)?/g;
  const params = [];
  let match;
  
  while ((match = paramRegex.exec(routePath)) !== null) {
    const [, name, optional, splat] = match;
    params.push({
      name,
      optional: !!optional,
      splat: !!splat,
      fullMatch: match[0]
    });
  }
  
  // Also handle standalone wildcard routes (*)
  if (routePath.includes('*') && !routePath.includes(':*')) {
    params.push({
      name: 'wild',
      optional: false,
      splat: true,
      fullMatch: '*'
    });
  }
  
  return params;
}

/**
 * Replace route parameters with actual values
 * @param {string} routePath - The route path template
 * @param {Object} params - Object with parameter values
 * @param {Object} options - Replacement options
 * @returns {string} - The resolved path
 */
export function replaceRouteParams(routePath, params = {}, options = {}) {
  const {
    strict = true, // Throw error if required param is missing
    encode = true, // URL encode parameter values
    defaultValue = '' // Default value for missing params
  } = options;
  
  let resolvedPath = routePath;
  const routeParams = parseRouteParams(routePath);
  
  for (const param of routeParams) {
    const { name, optional, fullMatch } = param;
    let value = params[name];
    
    // Handle missing parameters
    if (value === undefined || value === null) {
      if (optional) {
        // Remove optional parameter and its leading slash if present
        resolvedPath = resolvedPath.replace(`/${fullMatch}`, '').replace(fullMatch, '');
        continue;
      } else if (strict) {
        throw new Error(`Missing required route parameter: ${name}`);
      } else {
        value = defaultValue;
      }
    }
    
    // Convert value to string and optionally encode
    const stringValue = String(value);
    const encodedValue = encode ? encodeURIComponent(stringValue) : stringValue;
    
    // Replace the parameter in the path
    resolvedPath = resolvedPath.replace(fullMatch, encodedValue);
  }
  
  // Clean up any double slashes that might have been created
  resolvedPath = resolvedPath.replace(/\/+/g, '/');
  
  return resolvedPath;
}

/**
 * Check if a route path matches a given URL pattern
 * @param {string} routePath - The route path template
 * @param {string} url - The actual URL to match
 * @returns {Object|null} - Match result with params or null if no match
 */
export function matchRoute(routePath, url) {
  // Convert route path to regex pattern
  const regexPattern = routePath
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*\?/g, '(?:/([^/]+))?') // Optional params
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '([^/]+)') // Required params - removed extra slash
    .replace(/\*/g, '(.*)') // Wildcard routes
    .replace(/\//g, '\\/'); // Escape forward slashes
  
  const regex = new RegExp(`^${regexPattern}$`);
  const match = url.match(regex);
  
  if (!match) return null;
  
  // Extract parameter names
  const paramNames = parseRouteParams(routePath).map(p => p.name);
  
  // Build params object
  const params = {};
  for (let i = 0; i < paramNames.length; i++) {
    const value = match[i + 1];
    if (value !== undefined) {
      params[paramNames[i]] = decodeURIComponent(value);
    }
  }
  
  return {
    match: true,
    params,
    url,
    routePath
  };
}

/**
 * Generate multiple route variations from a template
 * @param {string} routePath - The route path template
 * @param {Array} paramSets - Array of parameter objects
 * @param {Object} options - Generation options
 * @returns {Array} - Array of resolved paths
 */
export function generateRoutes(routePath, paramSets = [], options = {}) {
  return paramSets.map(params => replaceRouteParams(routePath, params, options));
}

/**
 * Common parameter types with validation
 */
export const paramTypes = {
  slug: {
    pattern: /^[a-z0-9-]+$/,
    description: 'URL-friendly identifier (lowercase, numbers, hyphens)',
    transform: (value) => String(value).toLowerCase().replace(/[^a-z0-9-]/g, '-')
  },
  
  id: {
    pattern: /^\d+$/,
    description: 'Numeric identifier',
    transform: (value) => String(parseInt(value, 10))
  },
  
  uuid: {
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    description: 'UUID format',
    transform: (value) => String(value).toLowerCase()
  },
  
  date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    description: 'Date in YYYY-MM-DD format',
    transform: (value) => {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    }
  }
};

/**
 * Validate parameter value against a type
 * @param {string} value - The value to validate
 * @param {string|Object} type - The parameter type (string name or type object)
 * @returns {boolean} - Whether the value is valid
 */
export function validateParam(value, type) {
  if (typeof type === 'string') {
    type = paramTypes[type];
  }
  
  if (!type || !type.pattern) {
    return true; // No validation if type not found
  }
  
  return type.pattern.test(String(value));
}

/**
 * Transform parameter value according to its type
 * @param {any} value - The value to transform
 * @param {string|Object} type - The parameter type
 * @returns {string} - The transformed value
 */
export function transformParam(value, type) {
  if (typeof type === 'string') {
    type = paramTypes[type];
  }
  
  if (!type || !type.transform) {
    return String(value);
  }
  
  return type.transform(value);
}
