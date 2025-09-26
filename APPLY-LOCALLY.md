# 🔄 Apply Routing Changes to Your Local Clovie

## 🎯 Quick Apply Method

### Step 1: Create New Router File

**Create:** `lib/core/router.js` (306 lines)

```bash
# Download the router file
curl -o lib/core/router.js https://raw.githubusercontent.com/adrianjonmiller/clovie/routing-update/lib/core/router.js
```

**OR copy from the remote environment above** ⬆️

### Step 2: Update lib/main.js

**Add this import at the top:**
```javascript
import { ClovieRouter } from './core/router.js';
```

**In the constructor, after `this.watcher = new SmartWatcher(this);`:**
```javascript
// Initialize router
this.router = new ClovieRouter(this.config, this);
```

**Update the logging section:**
```javascript
console.log(`   Mode: ${this.config.mode}`);
console.log(`   Routes: ${this.config.routes?.length || 0} configured`);
console.log(`   API Routes: ${this.config.api?.length || 0} configured`);
```

**In the build() method, after template rendering:**
```javascript
// Generate route-based pages in static mode
if (this.config.mode === 'static' && this.config.routes?.length > 0) {
  console.log('🛣️  Generating static routes...');
  const routePages = await this.router.generateStaticRoutes();
  this.rendered = { ...this.rendered, ...routePages };
  console.log(`   Generated ${Object.keys(routePages).length} route-based pages`);
}
```

### Step 3: Update lib/core/server.js

**In constructor, add:**
```javascript
// Add JSON and URL encoding middleware
this.app.use(express.json());
this.app.use(express.urlencoded({ extended: true }));
```

**Replace the static file serving section in start() with:**
```javascript
// Setup routing based on mode
if (this.clovie.config.mode === 'live') {
  // Live mode: setup dynamic routing
  console.log('🔴 Live mode: Setting up dynamic routing...');
  this.clovie.router.setupDynamicRoutes(this.app);
} else {
  // Static mode: serve static files
  console.log('🟢 Static mode: Serving static files...');
  this.app.use(express.static(this.clovie.config.outputDir));
  
  // Explicitly handle root path to serve index.html
  this.app.get('/', (req, res) => {
    res.sendFile(path.join(this.clovie.config.outputDir, 'index.html'));
  });
}
```

### Step 4: Update config/clovie.config.js

**Add these new properties:**
```javascript
// Mode: 'static' for static site generation, 'live' for dynamic server
mode: 'static',

// Server configuration (for live mode)
server: {
  port: 3000,
  host: 'localhost',
  open: false
},

// Routes configuration
routes: [],

// API routes configuration
api: [],

// Global middleware (for live mode)
middleware: [],

// Global hooks
before: null,   // Global before hook
after: null,    // Global after hook
```

## ✅ Test It Works

```bash
# Test with your existing project
node bin/cli.js

# Should see new routing logs:
# Mode: static
# Routes: 0 configured
# API Routes: 0 configured
```