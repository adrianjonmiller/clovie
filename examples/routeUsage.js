/**
 * Example of how to use route parameter utilities in your Clovie project
 */

import { resolveRoute, extractRouteParams, routeHelpers } from '../lib/utils/routeIntegration.js';

// Example 1: Basic usage in your clovie.config.js
console.log('=== Basic Route Resolution ===');

// Your route configuration
const routes = [
  {
    name: 'Product',
    path: '/products/:slug',
    template: 'product.html',
    repeat: (state) => state.get(['products']) || [
      { id: 1, title: 'Amazing Laptop', slug: 'amazing-laptop' },
      { id: 2, title: 'Great Phone', slug: 'great-phone' }
    ],
    data: (state, item, params) => ({
      ...state.get(),
      product: item,
      slug: params.slug
    })
  }
];

// Generate actual paths
const products = [
  { id: 1, title: 'Amazing Laptop', slug: 'amazing-laptop' },
  { id: 2, title: 'Great Phone', slug: 'great-phone' }
];

products.forEach(product => {
  const path = resolveRoute('/products/:slug', { slug: product.slug });
  console.log(`Product "${product.title}" -> ${path}`);
});

// Example 2: Extract parameters from URLs
console.log('\n=== Parameter Extraction ===');

const testUrls = [
  '/products/amazing-laptop',
  '/products/great-phone',
  '/invalid/path'
];

testUrls.forEach(url => {
  const params = extractRouteParams('/products/:slug', url);
  console.log(`${url} -> ${params ? JSON.stringify(params) : 'No match'}`);
});

// Example 3: Using route helpers
console.log('\n=== Route Helpers ===');

const productRoute = routeHelpers.slugRoute('/products', 'product.html', (state) => products);
console.log('Generated route config:', JSON.stringify(productRoute, null, 2));

const userPostRoute = routeHelpers.nestedRoute(
  '/users', 'userId', 
  'posts', 'postId', 
  'user-post.html',
  (state) => [
    { userId: 1, postId: 1, title: 'First Post' },
    { userId: 1, postId: 2, title: 'Second Post' }
  ]
);
console.log('Generated nested route config:', JSON.stringify(userPostRoute, null, 2));

// Example 4: Integration with your build process
console.log('\n=== Build Integration Example ===');

import { processClovieRoutes } from '../lib/utils/routeIntegration.js';

const mockState = {
  get: (path) => {
    if (path && path.includes('products')) return products;
    return { products };
  }
};

const processedRoutes = processClovieRoutes(routes, { state: mockState });
console.log('Processed routes for build:');
processedRoutes.forEach(route => {
  console.log(`  ${route.routeName}: ${route.outputPath}`);
  console.log(`    Template: ${route.templatePath}`);
  console.log(`    Params: ${JSON.stringify(route.params)}`);
});

export { routes, products, mockState };
