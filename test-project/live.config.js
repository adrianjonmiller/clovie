import Handlebars from 'handlebars';

export default {
  // Live mode - dynamic server with real-time routing
  mode: 'live',
  
  // Server configuration
  server: {
    port: 3002,
    host: 'localhost',
    open: false
  },
  
  // Basic configuration
  views: './views',
  
  // Global data available to all routes
  data: {
    siteName: 'Clovie Test Site (Live)',
    description: 'Testing the new routing system in live mode with dynamic content'
  },
  
  // Global middleware - runs on every request
  middleware: [
    (req, res, next) => {
      // CORS middleware
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    },
    (req, res, next) => {
      // Request logging
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    }
  ],
  
  // Routes configuration
  routes: [
    {
      path: '/',
      name: 'home',
      view: 'index.html',
      data: async (params, req) => {
        // Simulate dynamic data fetching
        const timestamp = new Date().toISOString();
        return {
          title: 'Welcome Home (Live)',
          message: `This page is served dynamically! Generated at ${timestamp}`,
          posts: [
            { title: 'Hello World', slug: 'hello-world' },
            { title: 'Dynamic Content', slug: 'dynamic-content' },
            { title: 'Real-time Updates', slug: 'real-time-updates' }
          ]
        };
      }
    },
    {
      path: '/about',
      name: 'about',
      view: 'about.html',
      data: (params, req) => ({
        title: 'About Us (Live)',
        content: 'This about page is served in real-time by Express! The content can change dynamically based on user data, time, or any other factors.',
        team: [
          { name: 'Alice', role: 'Full-Stack Developer' },
          { name: 'Bob', role: 'UI/UX Designer' },
          { name: 'Charlie', role: 'DevOps Engineer' }
        ]
      })
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      view: 'blog-post.html',
      data: async (params, req) => {
        // Simulate fetching from a database
        const posts = {
          'hello-world': { 
            title: 'Hello World', 
            content: 'Welcome to my blog! This is my very first post.',
            author: 'John Doe',
            date: '2024-01-01'
          },
          'dynamic-content': { 
            title: 'Dynamic Content with Clovie', 
            content: 'Clovie makes it super easy to create both static and dynamic sites!',
            author: 'Jane Smith', 
            date: '2024-01-15'
          },
          'real-time-updates': { 
            title: 'Real-time Updates', 
            content: 'With live mode, your content updates instantly without rebuilding!',
            author: 'Alex Johnson', 
            date: '2024-01-20'
          }
        };
        
        const post = posts[params.slug];
        if (!post) {
          throw new Error(`Blog post '${params.slug}' not found`);
        }
        
        return {
          title: post.title,
          slug: params.slug,
          post
        };
      },
      before: async (req, res) => {
        // Check if blog post exists before processing
        const validSlugs = ['hello-world', 'dynamic-content', 'real-time-updates'];
        if (!validSlugs.includes(req.params.slug)) {
          res.status(404).send(`<h1>404 - Blog Post Not Found</h1><p>The post "${req.params.slug}" doesn't exist.</p><a href="/">← Go Home</a>`);
          return false; // Stop processing
        }
        return true; // Continue processing
      }
    },
    {
      path: '/admin',
      name: 'admin',
      view: 'admin.html',
      data: () => ({
        title: 'Admin Dashboard',
        content: 'Welcome to the admin area! You can manage your site content here.'
      }),
      // Authentication middleware - only for this route
      before: (req, res) => {
        // Simple auth check (in real app, you'd check session/JWT)
        const authHeader = req.headers.authorization;
        const isAdmin = authHeader === 'Bearer admin-token';
        
        if (!isAdmin) {
          res.status(401).send(`
            <h1>🔐 Authentication Required</h1>
            <p>This page requires admin access.</p>
            <p>For testing, add this header: <code>Authorization: Bearer admin-token</code></p>
            <p>Or visit: <a href="/admin" onclick="fetch('/admin', {headers: {'Authorization': 'Bearer admin-token'}}).then(r => r.text()).then(html => document.body.innerHTML = html)">Auto-authenticate</a></p>
            <a href="/">← Go Home</a>
          `);
          return false;
        }
        return true;
      }
    }
  ],
  
  // API routes - shorthand for Express routes
  api: [
    {
      path: '/api/posts',
      method: 'GET',
      handler: async (req, res) => {
        // Simulate database fetch
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
        
        return {
          posts: [
            { id: 1, title: 'Hello World', slug: 'hello-world', author: 'John Doe' },
            { id: 2, title: 'Dynamic Content with Clovie', slug: 'dynamic-content', author: 'Jane Smith' },
            { id: 3, title: 'Real-time Updates', slug: 'real-time-updates', author: 'Alex Johnson' }
          ],
          meta: {
            total: 3,
            timestamp: new Date().toISOString()
          }
        };
      }
    },
    {
      path: '/api/posts/:slug',
      method: 'GET',
      handler: async (req, res) => {
        const posts = {
          'hello-world': { id: 1, title: 'Hello World', content: 'Welcome to my blog!', author: 'John Doe' },
          'dynamic-content': { id: 2, title: 'Dynamic Content', content: 'Clovie is awesome!', author: 'Jane Smith' },
          'real-time-updates': { id: 3, title: 'Real-time Updates', content: 'Live mode rocks!', author: 'Alex Johnson' }
        };
        
        const post = posts[req.params.slug];
        if (!post) {
          res.status(404);
          return { error: 'Post not found', slug: req.params.slug };
        }
        
        return { post };
      }
    },
    {
      path: '/api/posts',
      method: 'POST',
      handler: async (req, res) => {
        // Simulate creating a new post
        const newPost = {
          id: Date.now(),
          title: req.body.title,
          content: req.body.content,
          slug: req.body.title?.toLowerCase().replace(/\s+/g, '-'),
          author: req.body.author || 'Anonymous',
          created: new Date().toISOString()
        };
        
        return { 
          message: 'Post created successfully',
          post: newPost 
        };
      },
      middleware: [
        (req, res, next) => {
          // Validation middleware
          if (!req.body.title || !req.body.content) {
            res.status(400);
            return { error: 'Title and content are required' };
          }
          next();
        }
      ]
    }
  ],
  
  // Global hooks
  before: (req, res) => {
    // Global security/logging that runs before every request
    console.log(`🔍 Global before hook: ${req.method} ${req.path}`);
    
    // Example: Block certain user agents
    if (req.headers['user-agent']?.includes('BadBot')) {
      res.status(403).send('Forbidden');
      return false;
    }
    
    return true; // Continue processing
  },
  
  after: (req, res) => {
    // Global cleanup/logging after each request
    console.log(`✅ Global after hook: ${req.method} ${req.path} - ${res.statusCode}`);
  },
  
  // Template compiler
  compiler: (template, data) => {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (err) {
      console.warn(`⚠️  Template compilation error: ${err.message}`);
      return template;
    }
  }
};