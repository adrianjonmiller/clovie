# 🧪 Clovie Routing System Test

This project demonstrates and tests Clovie's new routing system in both **static** and **live** modes.

## 📁 Project Structure

```
test-project/
├── views/                  # Template files
│   ├── index.html         # Home page template
│   ├── about.html         # About page template  
│   ├── blog-post.html     # Blog post template (with params)
│   └── admin.html         # Protected admin template
├── static.config.js       # Static mode configuration
├── live.config.js         # Live mode configuration
└── package.json           # Scripts for testing
```

## 🚀 Quick Start

### 1. Test Static Mode

Generates static HTML files from routes:

```bash
# Build static site
npm run build:static

# View generated files
ls -la dist-static/
cat dist-static/index.html
```

**What it does:**
- ✅ Generates `index.html` and `about.html` 
- ✅ Merges global data with route-specific data
- ✅ Skips parameterized routes (like `/blog/:slug`) for now
- ✅ Creates fully self-contained HTML files

### 2. Test Live Mode

Runs a dynamic Express server with routing:

```bash
# Start live development server
npm run dev:live
```

**Then test these URLs:**

| URL | Description |
|-----|-------------|
| http://localhost:3002/ | Home page (dynamic data) |
| http://localhost:3002/about | About page |
| http://localhost:3002/blog/hello-world | Blog post with parameters |
| http://localhost:3002/blog/dynamic-content | Another blog post |
| http://localhost:3002/blog/nonexistent | 404 error (before hook) |
| http://localhost:3002/admin | Protected page (needs auth) |

### 3. Test API Routes

With the live server running:

```bash
# Test GET endpoints
curl http://localhost:3002/api/posts
curl http://localhost:3002/api/posts/hello-world

# Test POST endpoint
curl -X POST http://localhost:3002/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"New Post","content":"This is a test post","author":"Test User"}'

# Test validation (should fail)
curl -X POST http://localhost:3002/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"No Content"}'
```

### 4. Test Authentication

The admin page requires authentication:

```bash
# This will be rejected
curl http://localhost:3002/admin

# This will work
curl -H "Authorization: Bearer admin-token" http://localhost:3002/admin
```

## 🔍 What to Look For

### ✅ Data Merging
- Global data (`siteName`, `description`) appears on all pages
- Route-specific data (`title`, `message`) merges seamlessly
- No "global vs local" complexity - just one unified data object

### ✅ Parameter Handling
- `/blog/:slug` extracts `slug` parameter
- Parameters passed to `data()` function as first argument
- Works in live mode, skipped in static mode (for now)

### ✅ Before/After Hooks
- **Global hooks**: Run on every request
- **Route hooks**: Run for specific routes only
- **Before hooks**: Can block requests (perfect for auth)
- **After hooks**: Run after response (logging, cleanup)

### ✅ Middleware Support
- **Global middleware**: CORS, logging, etc.
- **Route middleware**: Route-specific logic
- **API middleware**: Validation, auth per endpoint

### ✅ Mode Switching
- **Static**: Fast, cacheable, great for content sites
- **Live**: Dynamic, real-time, great for apps
- Same config structure, different behavior

## 🧐 Deep Testing

### Test Parameter Extraction
```bash
# Should work
curl http://localhost:3002/blog/hello-world

# Should show different content  
curl http://localhost:3002/blog/dynamic-content

# Should 404 with custom message
curl http://localhost:3002/blog/does-not-exist
```

### Test Middleware Chain
Watch the console logs while making requests to see:
- Global middleware logging
- Global before hooks
- Route-specific before hooks  
- Route processing
- Global after hooks

### Test API Responses
```bash
# Pretty-print JSON responses
curl -s http://localhost:3002/api/posts | jq .
curl -s http://localhost:3002/api/posts/hello-world | jq .

# Test error handling
curl -s http://localhost:3002/api/posts/nonexistent | jq .
```

## 🐛 Troubleshooting

### Port Already in Use
If port 3002 is busy, edit `live.config.js`:
```javascript
server: {
  port: 3003,  // Change this
  host: 'localhost'
}
```

### Missing Dependencies
Make sure you're in the parent directory with node_modules:
```bash
cd .. && npm install
cd test-project
```

### Template Errors
Check the console for Handlebars compilation errors. All templates use basic `{{variable}}` syntax.

## 📊 Expected Results

### Static Mode Output
```
📁 Clovie Configuration:
   Mode: static
   Views: ./views
   Routes: 3 configured
   API Routes: 0 configured
🛣️  Generating static routes...
✅ Generated static route: / -> index.html
✅ Generated static route: /about -> about.html
   Generated 2 route-based pages
```

### Live Mode Output  
```
📁 Clovie Configuration:
   Mode: live
   Routes: 4 configured
   API Routes: 3 configured
🔴 Live mode: Setting up dynamic routing...
✅ Registered dynamic route: /
✅ Registered dynamic route: /about  
✅ Registered dynamic route: /blog/:slug
✅ Registered dynamic route: /admin
✅ Registered API route: GET /api/posts
✅ Registered API route: GET /api/posts/:slug
✅ Registered API route: POST /api/posts
🌐 Development server running at http://localhost:3002
```

## 🎯 Key Features Demonstrated

- [x] **Route Configuration**: `path`, `view`, `name`, `data` properties
- [x] **Parameter Support**: `/blog/:slug` with parameter extraction
- [x] **Data Merging**: Global + route data seamlessly combined
- [x] **Static Generation**: Routes → HTML files
- [x] **Dynamic Serving**: Real-time Express routing
- [x] **API Routes**: Shorthand Express endpoint creation
- [x] **Authentication**: Before hooks for access control
- [x] **Middleware**: Global and route-specific middleware chains
- [x] **Error Handling**: Graceful 404s and validation errors

This test suite covers all the routing features you requested! 🚀