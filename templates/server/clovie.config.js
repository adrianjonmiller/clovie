import express from 'express';

export default {
  // 🌐 Server application mode - full Express.js app
  type: 'server',
  port: 3000,
  
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

  // 💾 Database configuration (SQLite)
  dbPath: './data/app.db',
  
  // Express middleware setup
  middleware: [
    express.json(),                    // Parse JSON bodies
    express.urlencoded({ extended: true }) // Parse form data
  ],

  // 🛣️ API endpoints
  api: [
    {
      path: '/api/status',
      method: 'GET',
      action: async (state, event) => {
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0'
        };
      }
    },
    {
      path: '/api/users',
      method: 'GET', 
      action: async (state, event) => {
        // Get users from state/database
        const users = state.get('users') || [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ];
        return { users, total: users.length };
      }
    },
    {
      path: '/api/users',
      method: 'POST',
      action: async (state, event) => {
        const { name, email } = event.body;
        
        if (!name || !email) {
          return { error: 'Name and email are required', status: 400 };
        }
        
        const newUser = {
          id: Date.now(), // Simple ID generation
          name,
          email,
          createdAt: new Date().toISOString()
        };
        
        // Save to state (in production, use database)
        const users = state.get('users') || [];
        users.push(newUser);
        state.set('users', users);
        
        return { success: true, user: newUser };
      }
    },
    {
      path: '/api/users/:id',
      method: 'GET',
      action: async (state, event) => {
        const userId = parseInt(event.params.id);
        const users = state.get('users') || [];
        const user = users.find(u => u.id === userId);
        
        if (!user) {
          return { error: 'User not found', status: 404 };
        }
        
        return { user };
      }
    }
  ],

  // 📄 Server-rendered routes (dynamic pages)
  routes: [
    {
      name: 'User Profile',
      path: '/user/:id',
      template: 'profile.html',
      data: async (state, params) => {
        const userId = parseInt(params.id);
        const users = state.get('users') || [];
        const user = users.find(u => u.id === userId) || {
          id: userId,
          name: 'Unknown User',
          email: 'unknown@example.com'
        };
        
        return {
          user,
          title: `${user.name}'s Profile`
        };
      }
    }
  ]

  // 🚀 Ready for production? Add these:
  
  // Database integration
  // api: [{
  //   path: '/api/posts',
  //   method: 'GET',
  //   action: async (state, event) => {
  //     const posts = await state.db.query('SELECT * FROM posts ORDER BY created_at DESC');
  //     return { posts };
  //   }
  // }],
  
  // Authentication middleware
  // middleware: [
  //   express.json(),
  //   authenticateUser,
  //   authorizeRequest
  // ],
  
  // WebSocket support
  // websocket: {
  //   onConnection: (socket) => {
  //     socket.emit('welcome', { message: 'Connected to server' });
  //   }
  // }
};