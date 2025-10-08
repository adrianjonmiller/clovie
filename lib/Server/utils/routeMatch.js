// Import URLPattern polyfill synchronously - no-op on modern Node.js
import 'urlpattern-polyfill';

/**
 * Compile a route pattern into a matcher function using URLPattern
 * @param {string} pattern - Route pattern (e.g., '/users/:id', '/api/*')
 * @returns {Function} - Function that returns params object or null
 */
export function compileRoute(pattern) {
  // URLPattern supports :param syntax directly, no conversion needed
  const pat = new URLPattern({ pathname: pattern });
  
  return (pathname) => {
    const match = pat.exec({ pathname });
    return match?.pathname.groups ?? null;
  };
}

/**
 * Parse route parameters from a route path for documentation
 * @param {string} routePath - The route path (e.g., '/users/:id/posts/:postId')
 * @returns {Array} Array of parameter objects with name and type info
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
