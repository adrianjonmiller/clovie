export default {
  // 🌐 Server application mode - uses Node.js HTTP server by default
  type: 'server',
  port: 3000,
  
  // 🎨 Template engine (Nunjucks is default)
  renderEngine: 'nunjucks',  // or 'handlebars', 'pug', 'eta'
  
  // Application data and configuration
  data: {
    app: {
      name: '{{projectName}}',
      description: 'Full-stack web application built with Clovie',
      version: '1.0.0'
    },
    nav: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
      { title: 'API Demo', url: '/#api-demo' }
    ]
  },

  // 💾 Database configuration (document-oriented with WAL)
  dbPath: './data',      // Directory for database files
  walPath: './data',     // Directory for WAL files
  
  // 🛣️ API endpoints (RESTful JSON APIs)
  api: [
    {
      path: '/api/status',
      method: 'GET',
      handler: async (ctx, database) => {
        return ctx.respond.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0'
        });
      }
    },
    {
      path: '/api/users',
      method: 'GET', 
      handler: async (ctx, database) => {
        const users = database.collection('users');
        
        // Get all users from database
        const allUsers = users.keys().map(id => ({
          id,
          ...users.get([id])
        }));
        
        return ctx.respond.json({ 
          users: allUsers,
          total: allUsers.length 
        });
      }
    },
    {
      path: '/api/users',
      method: 'POST',
      handler: async (ctx, database) => {
        const { name, email } = ctx.body;
        
        if (!name || !email) {
          return ctx.respond.json(
            { error: 'Name and email are required' },
            400
          );
        }
        
        const users = database.collection('users');
        
        // Add user (auto-generates unique ID)
        const userId = users.add({
          name,
          email,
          createdAt: new Date().toISOString()
        });
        
        return ctx.respond.json({ 
          success: true,
          user: { id: userId, ...users.get([userId]) }
        });
      }
    },
    {
      path: '/api/users/:id',
      method: 'GET',
      handler: async (ctx, database) => {
        const userId = ctx.params.id;
        const users = database.collection('users');
        const user = users.get([userId]);
        
        if (!user) {
          return ctx.respond.json(
            { error: 'User not found' },
            404
          );
        }
        
        return ctx.respond.json({ user: { id: userId, ...user } });
      }
    }
  ],

  // 📄 Server-rendered routes (dynamic pages with SSR)
  routes: [
    {
      name: 'User Profile',
      path: '/user/:id',
      template: './views/profile.html',
      data: async (ctx, database) => {
        const userId = ctx.params.id;
        const users = database.collection('users');
        const user = users.get([userId]);
        
        return {
          user: user || { 
            name: 'Unknown User',
            email: 'unknown@example.com'
          },
          title: `${user?.name || 'Unknown'}'s Profile`
        };
      }
    }
  ]

  // 🚀 Advanced features:
  
  // Use Express adapter for middleware
  // adapter: 'express',
  // middleware: [
  //   express.json(),
  //   express.urlencoded({ extended: true })
  // ],
  
  // Server lifecycle hooks
  // hooks: {
  //   onRequest: async (ctx) => {
  //     console.log(ctx.req.method, ctx.req.url);
  //   },
  //   preHandler: async (ctx) => {
  //     // Auth logic, etc.
  //   },
  //   onError: async (ctx, error) => {
  //     console.error('Error:', error);
  //   }
  // },
  
  // Query database with filters
  // const admin = users.findWhere('role', '===', 'admin');
  // const allAdmins = users.findAllWhere('role', '===', 'admin');
  
  // Update documents
  // users.update([userId], user => ({
  //   ...user,
  //   lastSeen: new Date().toISOString()
  // }));
  
  // Nested collections
  // const posts = database.collection('posts');
  // const comments = posts.collection('comments');
  // comments.set([postId, 'comment1'], { text: 'Great!' });
};
