/**
 * HTTP parsing utilities for request body and query parameters
 */

/**
 * Parse request body based on content type
 * @param {Object} req - Node.js request object
 * @returns {Object|null} Parsed body object or null
 */
export async function parseBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      resolve(null);
      return;
    }

    const contentType = req.headers['content-type'] || '';
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        if (contentType.includes('application/json')) {
          resolve(body ? JSON.parse(body) : {});
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          resolve(parseUrlEncoded(body));
        } else if (contentType.includes('multipart/form-data')) {
          // For now, just return the raw body for multipart
          // Could be enhanced with proper multipart parsing
          resolve({ raw: body });
        } else {
          resolve(body || null);
        }
      } catch (error) {
        resolve(null);
      }
    });

    req.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Parse URL-encoded form data
 * @param {string} data - URL-encoded string
 * @returns {Object} Parsed object
 */
function parseUrlEncoded(data) {
  const result = {};
  const pairs = data.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      const decodedKey = decodeURIComponent(key);
      const decodedValue = value ? decodeURIComponent(value) : '';
      
      // Handle arrays (key[] or key[0])
      if (decodedKey.endsWith('[]')) {
        const arrayKey = decodedKey.slice(0, -2);
        if (!result[arrayKey]) result[arrayKey] = [];
        result[arrayKey].push(decodedValue);
      } else {
        result[decodedKey] = decodedValue;
      }
    }
  }
  
  return result;
}

/**
 * Parse query parameters from URLSearchParams
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed query object with support for arrays
 */
export function parseQuery(searchParams) {
  const result = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Handle array parameters (key[] or key[0])
    if (key.endsWith('[]') || /\[\d*\]$/.test(key)) {
      const arrayKey = key.replace(/\[\d*\]$/, '').replace('[]', '');
      if (!result[arrayKey]) result[arrayKey] = [];
      result[arrayKey].push(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}
