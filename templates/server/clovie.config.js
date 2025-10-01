import express from 'express';

export default {
  // Server-side application configuration  
  type: 'server',
  port: 3000,
  
  data: {
    title: '{{projectName}}',
    description: 'Full-stack web application built with Clovie',
    author: 'Your Name',
    version: '1.0.0'
  },

  // Middleware configuration (functions that run before routes)
  middleware: [
    express.json(),
    express.urlencoded({ extended: true })
  ],

  // API routes configuration
  api: [
    {
      name: 'API Status',
      path: '/api/status',
      method: 'GET',
      action: async (state, event) => {
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        };
      }
    },
    {
      name: 'Get Users',
      path: '/api/users',
      method: 'GET', 
      action: async (state, event) => {
        // Get users from state or return mock data
        const users = state.get ? state.get('users') || [] : [];
        return {
          users,
          total: users.length
        };
      }
    },
    {
      name: 'Create User',
      path: '/api/users',
      method: 'POST',
      action: async (state, event) => {
        const { name, email } = event.body;
        const newUser = {
          id: Date.now(),
          name,
          email,
          createdAt: new Date().toISOString()
        };
        
        // Add user to state if available
        if (state.set) {
          const users = state.get('users') || [];
          users.push(newUser);
          state.set('users', users);
        }
        
        return { success: true, user: newUser };
      }
    },
    {
      name: 'Get User by ID',
      path: '/api/users/:id',
      method: 'GET',
      action: async (state, event) => {
        const userId = parseInt(event.params.id);
        const users = state.get ? state.get('users') || [] : [];
        const user = users.find(u => u.id === userId);
        
        if (!user) {
          return { error: 'User not found', status: 404 };
        }
        
        return { user };
      }
    }
  ],

  // Configured routes (server-rendered pages with templates)
  routes: [
    {
      name: 'User Profile',
      path: '/user/:id',
      template: './views/profile.html',
      data: async (state, params) => {
        const userId = parseInt(params.id);
        const users = state.get ? state.get('users') || [] : [];
        const user = users.find(u => u.id === userId);
        
        return {
          user: user || { name: 'Unknown User', email: 'unknown@example.com' },
          title: `User Profile - ${user?.name || 'Unknown'}`
        };
      }
    }
  ]
};
