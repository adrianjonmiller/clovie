/**
 * Example usage of route parameter utilities
 */

import { replaceRouteParams, parseRouteParams, generateRoutes } from './routeParams.js';
import { processRoutes, createRoute } from './routeUtils.js';

// Example 1: Basic parameter replacement
console.log('=== Basic Parameter Replacement ===');
const productRoute = '/products/:slug';
const productParams = { slug: 'amazing-product' };
const resolvedPath = replaceRouteParams(productRoute, productParams);
console.log(`${productRoute} + ${JSON.stringify(productParams)} = ${resolvedPath}`);

// Example 2: Multiple parameters
console.log('\n=== Multiple Parameters ===');
const userPostRoute = '/users/:id/posts/:postId';
const userPostParams = { id: 123, postId: 456 };
const resolvedUserPath = replaceRouteParams(userPostRoute, userPostParams);
console.log(`${userPostRoute} + ${JSON.stringify(userPostParams)} = ${resolvedUserPath}`);

// Example 3: Optional parameters
console.log('\n=== Optional Parameters ===');
const blogRoute = '/blog/:category?/:year?';
const blogParams1 = { category: 'tech', year: '2023' };
const blogParams2 = { category: 'design' };
const blogParams3 = {};

console.log(`${blogRoute} + ${JSON.stringify(blogParams1)} = ${replaceRouteParams(blogRoute, blogParams1)}`);
console.log(`${blogRoute} + ${JSON.stringify(blogParams2)} = ${replaceRouteParams(blogRoute, blogParams2)}`);
console.log(`${blogRoute} + ${JSON.stringify(blogParams3)} = ${replaceRouteParams(blogRoute, blogParams3)}`);

// Example 4: Generate multiple routes
console.log('\n=== Generate Multiple Routes ===');
const products = [
  { id: 1, slug: 'laptop' },
  { id: 2, slug: 'phone' },
  { id: 3, slug: 'tablet' }
];
const generatedRoutes = generateRoutes(productRoute, products);
console.log('Generated routes:', generatedRoutes);

// Example 5: Route processing with data
console.log('\n=== Route Processing ===');
const routes = [
  createRoute({
    name: 'Product',
    path: '/products/:slug',
    template: 'product.html',
    paramTypes: {
      slug: 'slug'
    },
    repeat: (state) => products,
    data: (state, item, params) => ({
      product: item,
      slug: params.slug
    })
  })
];

const mockState = {
  get: (path) => path ? products : { products }
};

const processedRoutes = processRoutes(routes, { state: mockState });
console.log('Processed routes:');
processedRoutes.forEach(route => {
  console.log(`  ${route.actualPath} -> ${route.template} (${JSON.stringify(route.params)})`);
});

// Example 6: Parameter validation
console.log('\n=== Parameter Validation ===');
import { validateParam, paramTypes } from './routeParams.js';

const testParams = [
  { value: 'amazing-product', type: 'slug', expected: true },
  { value: 'Amazing Product!', type: 'slug', expected: false },
  { value: '123', type: 'id', expected: true },
  { value: 'abc', type: 'id', expected: false },
  { value: '2023-12-25', type: 'date', expected: true },
  { value: '25/12/2023', type: 'date', expected: false }
];

testParams.forEach(({ value, type, expected }) => {
  const isValid = validateParam(value, type);
  const status = isValid === expected ? '✅' : '❌';
  console.log(`${status} ${value} (${type}): ${isValid} (expected: ${expected})`);
});

export {
  replaceRouteParams,
  parseRouteParams,
  generateRoutes,
  processRoutes,
  createRoute
};
