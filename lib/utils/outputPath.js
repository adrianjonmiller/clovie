/**
 * Utility function to determine the correct output path for a route
 * @param {string} relativePath - The relative path from the route
 * @returns {string} - The formatted output path
 */
export function formatOutputPath(relativePath) {
  // Remove any leading slash for consistent processing
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  // Already has .html extension, use as-is
  if (cleanPath.endsWith('.html')) {
    return cleanPath;
  }
  
  // Has trailing slash, convert to index.html
  if (cleanPath.endsWith('/')) {
    return `${cleanPath}index.html`;
  }
  
  // Empty path (root), use index.html
  if (cleanPath === '') {
    return 'index.html';
  }
  
  // No extension and no trailing slash, add .html
  return `${cleanPath}.html`;
}

