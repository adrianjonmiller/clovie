/**
 * Example usage of the new Server adapter system
 */

import { createClovie } from '../createClovie.js';
import { ExpressAdapter } from '../adapters/express.js';

// Example 1: Using built-in HTTP adapter (default)
async function httpExample() {
  console.log('🚀 Starting HTTP adapter example...');
  
  const clovie = await createClovie();
  
  // Add routes using the new context-based API
  clovie.server.add('GET', '/', (ctx) => {
    return ctx.respond.json({ 
      message: 'Hello from HTTP adapter!',
      adapter: 'http'
    });
  });

  clovie.server.add('GET', '/users/:id', (ctx) => {
    return ctx.respond.json({ 
      userId: ctx.req.params.id,
      query: ctx.req.query,
      adapter: 'http'
    });
  });

  // Configure hooks
  clovie.server.hooks({
    onRequest: async (ctx) => {
      console.log(`📥 ${ctx.req.method} ${ctx.req.path}`);
    },
    onSend: async (ctx, response) => {
      console.log(`📤 Sent ${response.type} response`);
    }
  });

  // Start server with HTTP adapter (default)
  const server = await clovie.server.listen({ port: 3000 });
  console.log(`✅ HTTP server running on http://localhost:${server.address().port}`);
  
  // Keep server running for demo
  console.log('Press Ctrl+C to stop...');
  process.on('SIGINT', async () => {
    await clovie.server.stop();
    console.log('👋 Server stopped');
    process.exit(0);
  });
}

// Example 2: Using Express adapter
async function expressExample() {
  console.log('🚀 Starting Express adapter example...');
  
  const clovie = await createClovie();
  
  // Set Express adapter
  clovie.server.useAdapter(new ExpressAdapter());
  
  // Add routes
  clovie.server.add('GET', '/', (ctx) => {
    return ctx.respond.json({ 
      message: 'Hello from Express adapter!',
      adapter: 'express'
    });
  });

  clovie.server.add('POST', '/api/users', (ctx) => {
    return ctx.respond.json({ 
      created: true,
      user: ctx.req.body,
      adapter: 'express'
    }, 201);
  });

  // Configure hooks
  clovie.server.hooks({
    onRequest: async (ctx) => {
      console.log(`📥 ${ctx.req.method} ${ctx.req.path} (Express)`);
    },
    onError: async (ctx, error) => {
      console.error('❌ Error:', error.message);
      return ctx.respond.json({ error: 'Internal Server Error' }, 500);
    }
  });

  // Start server
  const server = await clovie.server.listen({ port: 3001 });
  console.log(`✅ Express server running on http://localhost:${server.address().port}`);
  
  // Keep server running for demo
  console.log('Press Ctrl+C to stop...');
  process.on('SIGINT', async () => {
    await clovie.server.stop();
    console.log('👋 Server stopped');
    process.exit(0);
  });
}

// Example 3: Advanced usage with custom middleware
async function advancedExample() {
  console.log('🚀 Starting advanced example...');
  
  const clovie = await createClovie();
  
  // Create Express adapter with custom Express instance
  try {
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
        middleware: ctx.req.raw.req.customProperty,
        adapter: 'express-with-middleware'
      });
    });

    const server = await clovie.server.listen({ port: 3002 });
    console.log(`✅ Advanced server running on http://localhost:${server.address().port}`);
    
    // Keep server running for demo
    console.log('Press Ctrl+C to stop...');
    process.on('SIGINT', async () => {
      await clovie.server.stop();
      console.log('👋 Server stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Express not available. Install with: npm install express');
    console.log('Falling back to HTTP adapter...');
    
    // Fallback to HTTP adapter
    clovie.server.add('GET', '/fallback', (ctx) => {
      return ctx.respond.json({ 
        message: 'Fallback to HTTP adapter',
        adapter: 'http-fallback'
      });
    });

    const server = await clovie.server.listen({ port: 3002 });
    console.log(`✅ Fallback server running on http://localhost:${server.address().port}`);
  }
}

// Run examples based on command line argument
const example = process.argv[2] || 'http';

switch (example) {
  case 'http':
    httpExample();
    break;
  case 'express':
    expressExample();
    break;
  case 'advanced':
    advancedExample();
    break;
  default:
    console.log('Usage: node kernel-usage.js [http|express|advanced]');
    console.log('Examples:');
    console.log('  node kernel-usage.js http      # HTTP adapter (default)');
    console.log('  node kernel-usage.js express   # Express adapter');
    console.log('  node kernel-usage.js advanced  # Advanced Express with middleware');
}
