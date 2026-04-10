---
sidebar_position: 10
title: Middleware
description: Configure Express middleware for body parsing, CORS, authentication, file uploads, and request handling order.
---

# Middleware

Express middleware functions that run before routes and API endpoints. When you configure middleware, Clovie automatically uses the Express adapter for full compatibility with the Express middleware ecosystem.

## Basic Middleware Setup

```javascript
import express from 'express';
import cors from 'cors';

export default {
  type: 'server',
  
  middleware: [
    express.json({ limit: '10mb' }),           // Parse JSON bodies
    express.urlencoded({ extended: true }),    // Parse form data
    cors({ origin: 'https://myapp.com' }),     // CORS configuration
    express.static('public')                   // Serve static files
  ]
};
```

**Note:** Clovie automatically switches to the Express adapter when middleware is configured. If no middleware is present, it uses the faster HTTP adapter.

## Authentication Middleware (Most Common Pattern)

Authentication is the most common middleware use case. Here are practical patterns:

### Selective Authentication (Protect Specific Routes)

```javascript
export default {
  type: 'server',
  
  middleware: [
    // Basic request logging
    (req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
      next();
    },
    
    // Selective authentication - only protect certain routes
    (req, res, next) => {
      // Public routes that don't need authentication
      const publicPaths = [
        '/api/login',
        '/api/register',
        '/api/health',
        '/api/docs'
      ];
      
      // Skip auth for public routes
      if (publicPaths.some(path => req.url.startsWith(path))) {
        return next();
      }
      
      // Protect all /api/protected/* routes
      if (req.url.startsWith('/api/protected/')) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please provide a Bearer token'
          });
        }
        
        try {
          // In a real app, verify JWT token here
          const user = verifyJWT(token);
          req.user = user; // Attach user info to request
          next();
        } catch (error) {
          return res.status(401).json({ 
            error: 'Invalid token',
            message: 'Token verification failed'
          });
        }
      } else {
        // All other routes pass through
        next();
      }
    }
  ],
  
  api: [
    // Public endpoint - no auth needed
    {
      method: 'GET',
      path: '/api/login',
      handler: (ctx) => ctx.respond.json({ message: 'Login endpoint' })
    },
    
    // Protected endpoint - requires Bearer token
    {
      method: 'GET', 
      path: '/api/protected/profile',
      handler: (ctx) => {
        // ctx.req.user is available thanks to auth middleware
        return ctx.respond.json({ 
          user: ctx.req.raw.req.user,
          message: 'This is protected data'
        });
      }
    }
  ]
};
```

### Simple API Key Authentication

```javascript
export default {
  type: 'server',
  
  middleware: [
    (req, res, next) => {
      // Only protect API routes
      if (!req.url.startsWith('/api/')) {
        return next();
      }
      
      const apiKey = req.headers['x-api-key'];
      const validKeys = process.env.API_KEYS?.split(',') || [];
      
      if (!apiKey || !validKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'Provide a valid X-API-Key header'
        });
      }
      
      next();
    }
  ]
};
```

### Session-Based Authentication

```javascript
import session from 'express-session';

export default {
  type: 'server',
  
  middleware: [
    // Session middleware
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }),
    
    // Auth middleware using sessions
    (req, res, next) => {
      // Protect admin routes
      if (req.url.startsWith('/admin/')) {
        if (!req.session.user || req.session.user.role !== 'admin') {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Admin access required'
          });
        }
      }
      
      next();
    }
  ]
};
```

## Testing Your Auth Middleware

```bash
# Test public endpoint (should work)
curl http://localhost:3000/api/health

# Test protected endpoint without token (should return 401)
curl http://localhost:3000/api/protected/profile

# Test protected endpoint with token (should work)
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/protected/profile

# Test with API key
curl -H "X-API-Key: your-key" http://localhost:3000/api/data
```

## Middleware Execution Order

Middleware executes in **array order**. This is critical for auth flows:

```javascript
export default {
  middleware: [
    cors(),                    // 1. CORS (must be first)
    express.json(),           // 2. Body parsing
    requestLogger,            // 3. Logging
    rateLimiter,             // 4. Rate limiting
    authenticateUser,        // 5. Authentication (after parsing, before business logic)
    authorizeUser           // 6. Authorization (after auth)
  ]
};
```

## Common Middleware Patterns

```javascript
// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Middleware error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

// Request timeout middleware  
const timeout = (ms) => (req, res, next) => {
  const timer = setTimeout(() => {
    res.status(408).json({ error: 'Request timeout' });
  }, ms);
  
  res.on('finish', () => clearTimeout(timer));
  next();
};

// Custom headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

export default {
  type: 'server',
  middleware: [
    timeout(30000),           // 30 second timeout
    securityHeaders,          // Security headers
    express.json(),
    // ... your auth middleware
    errorHandler             // Error handling (should be last)
  ]
};
```

## Middleware for File Uploads

```javascript
import multer from 'multer';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

export default {
  type: 'server',
  
  middleware: [
    express.json(),
    upload.single('image')  // Expect single file with field name 'image'
  ]
};
```

For reusable middleware defined with engine service access, see [Factories](./factories).
