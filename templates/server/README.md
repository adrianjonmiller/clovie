# {{projectName}}

A full-stack web application built with [Clovie](https://github.com/adrianjonmiller/clovie) - combining the simplicity of static sites with the power of Express.js.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (with live reload)
npm run dev

# Start production server
npm start
```

Visit `http://localhost:3000` to see your application!

## ✨ Features

- 🌐 **Full Express.js Server** with Clovie integration
- 🛣️ **API Endpoints** with built-in state management
- 📄 **Server-Side Rendering** for dynamic content
- 💾 **SQLite Database** integration ready
- 🔄 **Live Reload** during development
- 🎨 **Asset Pipeline** for CSS/JS processing
- ⚡ **Real-time Updates** with WebSocket support

## 📁 Project Structure

```
{{projectName}}/
├── clovie.config.js       # Server configuration with API routes
├── package.json           # Dependencies and scripts
├── views/                 # Server-rendered templates
│   ├── index.html        # Homepage with API demos
│   ├── about.html        # About page
│   └── profile.html      # Dynamic user profile page
├── partials/              # Reusable template components
│   ├── header.html       # Site header with navigation
│   └── footer.html       # Site footer
├── scripts/               # Client-side JavaScript
│   └── app.js            # Main app with API helpers
├── styles/                # SCSS stylesheets
│   └── main.scss         # Modern, clean styles
└── data/                  # Database storage (auto-created)
```

## 🛣️ API Endpoints

This template includes working API endpoints:

### Server Status
```
GET /api/status
Response: { status, timestamp, uptime, version }
```

### User Management
```
GET /api/users              # List all users
POST /api/users             # Create new user (requires name, email)
GET /api/users/:id          # Get specific user by ID
```

### Example API Usage
```javascript
// Get server status
const status = await fetch('/api/status').then(r => r.json());

// Create a new user
const user = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
}).then(r => r.json());

// Get user by ID
const userData = await fetch('/api/users/123').then(r => r.json());
```

## 📄 Server Routes

- **`/`** - Homepage with interactive API demos
- **`/about`** - About page explaining server features
- **`/user/:id`** - Dynamic user profile pages (server-rendered)

## ⚙️ Configuration Deep Dive

The `clovie.config.js` demonstrates:

### API Route Configuration
```javascript
api: [{
  path: '/api/users',
  method: 'POST',
  action: async (state, event) => {
    const { name, email } = event.body;
    
    // Validate input
    if (!name || !email) {
      return { error: 'Name and email required', status: 400 };
    }
    
    // Save to state/database
    const user = { id: Date.now(), name, email };
    const users = state.get('users') || [];
    state.set('users', [...users, user]);
    
    return { success: true, user };
  }
}]
```

### Server-Rendered Routes
```javascript
routes: [{
  name: 'User Profile',
  path: '/user/:id',
  template: 'profile.html',
  data: async (state, params) => {
    const user = await getUserById(params.id);
    const stats = await getUserStats(params.id);
    return { user, stats, title: `${user.name}'s Profile` };
  }
}]
```

### Express Middleware Setup
```javascript
middleware: [
  express.json(),                    // Parse JSON bodies
  express.urlencoded({ extended: true }), // Parse form data
  // Add CORS, authentication, etc.
]
```

## 💾 Database Integration

### SQLite Setup (Recommended)
```javascript
// clovie.config.js
export default {
  type: 'server',
  dbPath: './data/app.db',  // SQLite database path
  
  api: [{
    path: '/api/posts',
    method: 'GET',
    action: async (state, event) => {
      // Access database through state.db
      const posts = await state.db.query('SELECT * FROM posts ORDER BY created_at DESC');
      return { posts };
    }
  }]
};
```

### State Management (Simple)
```javascript
action: async (state, event) => {
  // Get data from state
  const users = state.get('users') || [];
  
  // Modify data
  users.push(newUser);
  
  // Save back to state
  state.set('users', users);
  
  return { success: true };
}
```

## 🔧 Advanced Features

### Authentication Middleware
```javascript
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;
  // Verify token logic...
  req.user = verifiedUser;
  next();
};

export default {
  middleware: [
    express.json(),
    authenticateUser
  ]
};
```

### WebSocket Integration
```javascript
// Add to clovie.config.js
websocket: {
  onConnection: (socket) => {
    socket.emit('welcome', { message: 'Connected!' });
    
    socket.on('chat', (data) => {
      // Broadcast to all clients
      socket.broadcast.emit('chat', data);
    });
  }
}
```

### File Uploads
```javascript
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

export default {
  middleware: [upload.single('file')],
  
  api: [{
    path: '/api/upload',
    method: 'POST',
    action: async (state, event) => {
      const file = event.file;
      // Process uploaded file...
      return { success: true, filename: file.filename };
    }
  }]
};
```

## 🚀 Production Deployment

### Environment Variables
```bash
# .env
NODE_ENV=production
PORT=3000
DATABASE_URL=sqlite:./data/production.db
```

### Process Manager (PM2)
```bash
npm install -g pm2
pm2 start npm --name "{{projectName}}" -- start
pm2 save
pm2 startup
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Available Commands

```bash
npm run dev      # Development server with live reload  
npm start        # Production server
npm run build    # Build assets only
npm run test     # Run tests
```

## 📊 Monitoring & Debugging

The template includes built-in endpoints for monitoring:

- **`GET /health`** - Health check endpoint
- **`GET /api/info`** - Application info and metrics

### Error Handling
```javascript
api: [{
  path: '/api/data',
  method: 'GET',
  action: async (state, event) => {
    try {
      const data = await fetchData();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Internal server error', status: 500 };
    }
  }
}]
```

## 📚 Learn More

- [Clovie Documentation](https://github.com/adrianjonmiller/clovie)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [API Design Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)

---

*Full-stack web applications made simple with Clovie 🌐*