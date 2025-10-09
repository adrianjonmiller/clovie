import express from 'express';
import cors from 'cors';

export default {
  // Full-stack server application example
  type: 'server',
  port: process.env.PORT || 3000,
  
  // Application data
  data: {
    app: {
      name: 'Task Manager API',
      version: '2.0.0',
      description: 'A full-featured task management application'
    },
    nav: [
      { title: 'Dashboard', url: '/dashboard' },
      { title: 'Tasks', url: '/tasks' },
      { title: 'Projects', url: '/projects' },
      { title: 'API Docs', url: '/api-docs' }
    ]
  },
  
  // Database configuration
  dbPath: './data/tasks.db',
  
  // Express middleware stack
  middleware: [
    // CORS configuration
    cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:8080'],
      credentials: true
    }),
    
    // Body parsing
    express.json({ limit: '10mb' }),
    express.urlencoded({ extended: true }),
    
    // Static files
    express.static('public', {
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
    }),
    
    // Custom logging middleware
    (req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} ${req.method} ${req.url}`);
      next();
    },
    
    // Authentication middleware (simplified)
    (req, res, next) => {
      // Skip auth for public routes
      if (req.url.startsWith('/api/auth') || req.url.startsWith('/api/health')) {
        return next();
      }
      
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token && req.url.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // In a real app, verify JWT token here
      req.user = { id: 1, name: 'Demo User' };
      next();
    }
  ],
  
  // REST API endpoints
  api: [
    // Health check
    {
      path: '/api/health',
      method: 'GET',
      action: async (state, event) => {
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          uptime: process.uptime()
        };
      }
    },
    
    // Authentication
    {
      path: '/api/auth/login',
      method: 'POST',
      action: async (state, event) => {
        const { email, password } = event.body;
        
        // Simplified auth - in production, verify against database
        if (email === 'demo@example.com' && password === 'demo123') {
          return {
            success: true,
            token: 'demo-jwt-token',
            user: { id: 1, name: 'Demo User', email }
          };
        }
        
        return { error: 'Invalid credentials', status: 401 };
      }
    },
    
    // Tasks CRUD operations
    {
      path: '/api/tasks',
      method: 'GET',
      action: async (state, event) => {
        const { status, project, page = 1, limit = 20 } = event.query;
        
        // Get tasks from database or state
        let tasks = state.get('tasks') || [
          {
            id: 1,
            title: 'Complete API documentation',
            description: 'Write comprehensive API docs for all endpoints',
            status: 'in-progress',
            priority: 'high',
            projectId: 1,
            assignedTo: 1,
            dueDate: '2024-02-15',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T14:30:00Z'
          },
          {
            id: 2,
            title: 'Fix login bug',
            description: 'Resolve issue with user authentication flow',
            status: 'todo',
            priority: 'critical',
            projectId: 1,
            assignedTo: 1,
            dueDate: '2024-01-25',
            createdAt: '2024-01-10T09:00:00Z',
            updatedAt: '2024-01-10T09:00:00Z'
          }
        ];
        
        // Apply filters
        if (status) tasks = tasks.filter(t => t.status === status);
        if (project) tasks = tasks.filter(t => t.projectId === parseInt(project));
        
        // Pagination
        const start = (page - 1) * limit;
        const paginatedTasks = tasks.slice(start, start + limit);
        
        return {
          tasks: paginatedTasks,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: tasks.length,
            totalPages: Math.ceil(tasks.length / limit)
          }
        };
      }
    },
    
    {
      path: '/api/tasks',
      method: 'POST',
      action: async (state, event) => {
        const { title, description, status = 'todo', priority = 'medium', projectId, dueDate } = event.body;
        
        // Validation
        if (!title || title.trim().length < 3) {
          return { error: 'Title must be at least 3 characters', status: 400 };
        }
        
        const newTask = {
          id: Date.now(), // Simple ID generation
          title: title.trim(),
          description: description?.trim() || '',
          status,
          priority,
          projectId: projectId ? parseInt(projectId) : null,
          assignedTo: event.user?.id || 1,
          dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save to state/database
        const tasks = state.get('tasks') || [];
        tasks.push(newTask);
        state.set('tasks', tasks);
        
        return { success: true, task: newTask, status: 201 };
      }
    },
    
    {
      path: '/api/tasks/:id',
      method: 'GET',
      action: async (state, event) => {
        const taskId = parseInt(event.params.id);
        const tasks = state.get('tasks') || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
          return { error: 'Task not found', status: 404 };
        }
        
        return { task };
      }
    },
    
    {
      path: '/api/tasks/:id',
      method: 'PUT',
      action: async (state, event) => {
        const taskId = parseInt(event.params.id);
        const tasks = state.get('tasks') || [];
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          return { error: 'Task not found', status: 404 };
        }
        
        // Update task
        const updatedTask = {
          ...tasks[taskIndex],
          ...event.body,
          updatedAt: new Date().toISOString()
        };
        
        tasks[taskIndex] = updatedTask;
        state.set('tasks', tasks);
        
        return { success: true, task: updatedTask };
      }
    },
    
    {
      path: '/api/tasks/:id',
      method: 'DELETE',
      action: async (state, event) => {
        const taskId = parseInt(event.params.id);
        const tasks = state.get('tasks') || [];
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          return { error: 'Task not found', status: 404 };
        }
        
        const deletedTask = tasks.splice(taskIndex, 1)[0];
        state.set('tasks', tasks);
        
        return { success: true, task: deletedTask };
      }
    },
    
    // Projects endpoints
    {
      path: '/api/projects',
      method: 'GET',
      action: async (state, event) => {
        const projects = state.get('projects') || [
          {
            id: 1,
            name: 'Website Redesign',
            description: 'Complete overhaul of company website',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ];
        
        return { projects };
      }
    },
    
    // Statistics endpoint
    {
      path: '/api/stats',
      method: 'GET',
      action: async (state, event) => {
        const tasks = state.get('tasks') || [];
        
        const stats = {
          total: tasks.length,
          byStatus: {
            todo: tasks.filter(t => t.status === 'todo').length,
            'in-progress': tasks.filter(t => t.status === 'in-progress').length,
            completed: tasks.filter(t => t.status === 'completed').length
          },
          byPriority: {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            critical: tasks.filter(t => t.priority === 'critical').length
          }
        };
        
        return { stats };
      }
    }
  ],
  
  // Server-rendered routes
  routes: [
    {
      name: 'Dashboard',
      path: '/dashboard',
      template: 'dashboard.html',
      data: async (state, params) => {
        const tasks = state.get('tasks') || [];
        const recentTasks = tasks
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5);
          
        const stats = {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          pending: tasks.filter(t => t.status !== 'completed').length
        };
        
        return {
          recentTasks,
          stats,
          title: 'Dashboard - Task Manager'
        };
      }
    },
    
    {
      name: 'Task Detail',
      path: '/tasks/:id',
      template: 'task-detail.html',
      data: async (state, params) => {
        const taskId = parseInt(params.id);
        const tasks = state.get('tasks') || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
          // Handle 404 in template
          return { task: null, error: 'Task not found' };
        }
        
        return {
          task,
          title: `${task.title} - Task Manager`
        };
      }
    }
  ]
};

/*
This server configuration demonstrates:

1. **Full Express middleware stack** - CORS, body parsing, auth, logging
2. **Complete REST API** - Tasks CRUD with filtering, pagination, validation
3. **Authentication** - Simplified JWT-style auth with middleware
4. **Server-rendered routes** - Dashboard and detail pages
5. **State management** - Using Clovie's built-in state system
6. **Error handling** - Proper HTTP status codes and error responses
7. **Database ready** - Uses state for demo, easily switched to SQLite
8. **Production features** - Environment-based configuration

API Endpoints:
- GET /api/health - Health check
- POST /api/auth/login - User authentication
- GET /api/tasks - List tasks (with filtering/pagination)
- POST /api/tasks - Create new task
- GET /api/tasks/:id - Get specific task
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task
- GET /api/projects - List projects
- GET /api/stats - Get task statistics

Server Routes:
- GET /dashboard - Task dashboard
- GET /tasks/:id - Task detail page

Usage:
npm run dev  # Development server with live reload
npm start    # Production server
*/