/**
 * Example usage of Server with different adapters
 */

import { createClovie } from '../createClovie.js';
import { ExpressAdapter } from '../adapters/express.js';

// Example 1: Using built-in HTTP adapter (default)
async function httpExample() {
  const clovie = await createClovie();
  
  // Add routes using the new context-based API
  clovie.server.add('GET', '/', (ctx) => {
    return ctx.respond.json({ message: 'Hello from HTTP adapter!' });
  });

  clovie.server.add('GET', '/users/:id', (ctx) => {
    return ctx.respond.json({ 
      user: ctx.req.params.id,
      query: ctx.req.query 
    });
  });

  // Start server with HTTP adapter (default)
  await clovie.server.listen(3000);
  console.log('HTTP server running on port 3000');
}

// Example 2: Using Express adapter
async function expressExample() {
  const clovie = await createClovie();
  
  // Set Express adapter
  clovie.server.useAdapter(new ExpressAdapter());
  
  // Add routes
  clovie.server.add('GET', '/', (ctx) => {
    return ctx.respond.json({ message: 'Hello from Express adapter!' });
  });

  clovie.server.add('POST', '/api/users', (ctx) => {
    return ctx.respond.json({ 
      created: true,
      user: ctx.req.body 
    }, 201);
  });

  // Configure hooks
  clovie.server.hooks({
    onRequest: async (ctx) => {
      console.log(`${ctx.req.method} ${ctx.req.path}`);
    },
    onError: async (ctx, error) => {
      console.error('Error:', error);
      return ctx.respond.json({ error: 'Internal Server Error' }, 500);
    }
  });

  // Start server
  await clovie.server.listen({ port: 3001 });
  console.log('Express server running on port 3001');
}

// Example 3: Advanced Express usage with middleware
async function advancedExpressExample() {
  const clovie = await createClovie();
  
  // Create Express adapter with custom Express instance
  const express = await import('express');
  const app = express.default();
  
  // Add custom middleware
  app.use((req, res, next) => {
    req.customProperty = 'Custom middleware value';
    next();
  });
  
  const adapter = new ExpressAdapter(app);
  clovie.server.useAdapter(adapter);
  
  // Add routes that can access custom middleware
  clovie.server.add('GET', '/middleware', (ctx) => {
    return ctx.respond.json({ 
      middleware: ctx.req.raw.req.customProperty 
    });
  });

  await clovie.server.listen({ port: 3002 });
  console.log('Advanced Express server running on port 3002');
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting Server adapter examples...');
  
  // Uncomment to run specific examples:
  // httpExample();
  // expressExample();
  // advancedExpressExample();
}
