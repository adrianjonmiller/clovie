import Handlebars from 'handlebars';
import path from 'path';

export default {
  // Live mode - dynamic server with routing
  mode: 'live',
  
  // Server configuration
  server: {
    port: 3000,
    host: 'localhost',
    open: false
  },
  
  // Basic configuration
  views: './views',
  
  // Global data available to all routes
  data: {
    siteName: 'My Live Clovie Site',
    description: 'A dynamic site built with Clovie routing'
  },
  
  // Global middleware
  middleware: [
    (req, res, next) => {
      // CORS middleware
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    },
    (req, res, next) => {
      // Logging middleware
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
      data: () => ({
        title: 'Welcome Home',
        message: 'This is the home page from live server'
      })
    },
    {
      path: '/about',
      name: 'about',
      view: 'about.html',
      data: () => ({
        title: 'About Us',
        content: 'Learn more about our company (live)'
      })
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      view: 'blog-post.html',
      data: async (params, req) => {
        // Simulate fetching blog post data from database
        const posts = {
          'first-post': { 
            title: 'My First Post', 
            content: 'This is my very first blog post!',
            author: 'John Doe',
            date: '2024-01-01'
          },
          'second-post': { 
            title: 'Learning Clovie', 
            content: 'Clovie makes building sites so easy!',
            author: 'Jane Smith', 
            date: '2024-01-02'
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
        // Check if blog post exists
        const validSlugs = ['first-post', 'second-post'];
        if (!validSlugs.includes(req.params.slug)) {
          res.status(404).send('Blog post not found');
          return false;
        }
        return true;
      }
    },
    {
      path: '/admin',
      name: 'admin',
      view: 'admin.html',
      data: () => ({
        title: 'Admin Dashboard',
        content: 'Admin only content'
      }),
      before: (req, res) => {
        // Simple auth check (in real app, check session/token)
        const isAdmin = req.headers.authorization === 'Bearer admin-token';
        if (!isAdmin) {
          res.status(401).send('Unauthorized - Admin access required');
          return false;
        }
        return true;
      }
    }
  ],
  
  // API routes
  api: [
    {
      path: '/api/posts',
      method: 'GET',
      handler: async (req, res) => {
        return {
          posts: [
            { id: 1, title: 'First Post', slug: 'first-post' },
            { id: 2, title: 'Learning Clovie', slug: 'second-post' }
          ]
        };
      }
    },
    {
      path: '/api/posts/:slug',
      method: 'GET',
      handler: async (req, res) => {
        const posts = {
          'first-post': { id: 1, title: 'My First Post', content: 'This is my very first blog post!' },
          'second-post': { id: 2, title: 'Learning Clovie', content: 'Clovie makes building sites so easy!' }
        };
        
        const post = posts[req.params.slug];
        if (!post) {
          res.status(404).send('Post not found');
          return;
        }
        
        return { post };
      }
    },
    {
      path: '/api/posts',
      method: 'POST',
      handler: async (req, res) => {
        const newPost = {
          id: Date.now(),
          title: req.body.title,
          content: req.body.content,
          slug: req.body.title?.toLowerCase().replace(/\s+/g, '-')
        };
        
        return { 
          message: 'Post created successfully',
          post: newPost 
        };
      },
      middleware: [
        (req, res, next) => {
          // Simple validation middleware
          if (!req.body.title || !req.body.content) {
            res.status(400).json({ error: 'Title and content are required' });
            return;
          }
          next();
        }
      ]
    }
  ],
  
  // Global hooks
  before: (req, res) => {
    // Global security check or logging
    console.log(`🔍 Processing request: ${req.method} ${req.path}`);
    return true;
  },
  
  after: (req, res) => {
    console.log(`✅ Request completed: ${req.method} ${req.path}`);
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