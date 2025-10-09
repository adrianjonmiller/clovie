# {{projectName}}

A full-stack web application built with [Clovie](https://github.com/adrianjonmiller/clovie) - combining the simplicity of static sites with the power of server-side rendering.

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

- 🌐 **Native Node.js HTTP Server** - Fast and lightweight (Express adapter available)
- 🛣️ **API Endpoints** with collection-based database
- 📄 **Server-Side Rendering** with Nunjucks templates
- 💾 **Document Database** with Write-Ahead Logging (WAL)
- 🔄 **Live Reload** during development
- 🎨 **Asset Pipeline** for CSS/JS processing
- ⚡ **Zero Dependencies** - Works out of the box

## 📁 Project Structure

```
{{projectName}}/
├── clovie.config.js       # Server configuration with API routes
├── package.json           # Dependencies and scripts
├── views/                 # Server-rendered templates (Nunjucks)
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
    ├── app.db            # Database snapshot
    └── app.wal           # Write-ahead log
```

## 🛣️ API Endpoints

This template includes working API endpoints demonstrating collection-based database operations:

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
const userData = await fetch('/api/users/doc_abc123').then(r => r.json());
```

## 📄 Server Routes

- **`/`** - Homepage with interactive API demos
- **`/about`** - About page explaining server features
- **`/user/:id`** - Dynamic user profile pages (server-rendered with caching)

## ⚙️ Configuration Deep Dive

The `clovie.config.js` demonstrates modern server patterns:

### API Route Configuration
```javascript
api: [{
  path: '/api/users',
  method: 'POST',
  handler: async (ctx, database) => {
    const { name, email } = ctx.body;
    
    // Add to collection (auto-generates unique ID)
    const users = database.collection('users');
    const userId = users.add({ name, email });
    
    return ctx.respond.json({ 
      success: true,
      user: { id: userId, ...users.get([userId]) }
    });
  }
}]
```

### Server-Side Rendered Routes
```javascript
routes: [{
  name: 'User Profile',
  path: '/user/:id',
  template: './views/profile.html',
  data: async (ctx, database) => {
    const userId = ctx.params.id;
    const users = database.collection('users');
    const user = users.get([userId]);
    
    return {
      user,
      title: `${user.name}'s Profile`
    };
  }
}]
```

## 💾 Database Operations

The database uses a collection-based document store with automatic persistence:

### Basic Operations
```javascript
// Get a collection
const users = database.collection('users');

// Add with auto-generated ID
const userId = users.add({ 
  name: 'Alice',
  email: 'alice@example.com'
});

// Get by ID (uses path arrays)
const user = users.get([userId]);

// Update
users.update([userId], user => ({
  ...user,
  lastSeen: new Date().toISOString()
}));

// Query
const admin = users.findWhere('role', '===', 'admin');
const allAdmins = users.findAllWhere('role', '===', 'admin');

// Remove
users.remove([userId]);
```

### Nested Collections
```javascript
const posts = database.collection('posts');
const comments = posts.collection('comments');

comments.set([postId, 'comment1'], {
  author: 'Alice',
  text: 'Great post!',
  timestamp: Date.now()
});
```

## 🎨 Template Engine

Uses **Nunjucks** by default (Jinja2-like syntax):

```html
{% extends "layout.html" %}

{% block content %}
  <h1>{{ user.name }}</h1>
  <p>{{ user.email }}</p>
  
  {% for post in posts %}
    <article>{{ post.title }}</article>
  {% endfor %}
{% endblock %}
```

Switch to Handlebars, Pug, or Eta by changing:
```javascript
renderEngine: 'handlebars'  // or 'pug', 'eta'
```

## 🔧 Advanced Features

### Using Express Adapter (Optional)

Need Express middleware? Switch to the Express adapter:

```javascript
// clovie.config.js
import express from 'express';

export default {
  type: 'server',
  adapter: 'express',  // Enable Express adapter
  
  middleware: [
    express.json(),
    express.urlencoded({ extended: true }),
    express.static('public')
  ],
  
  // Your routes...
}
```

Then install Express:
```bash
npm install express
```

### Server Lifecycle Hooks

```javascript
hooks: {
  onRequest: async (ctx) => {
    console.log(ctx.req.method, ctx.req.url);
  },
  preHandler: async (ctx) => {
    // Auth logic
  },
  onError: async (ctx, error) => {
    console.error('Error:', error);
  }
}
```

## 📊 System Routes

Clovie automatically provides:
- `GET /health` - Health check endpoint
- `GET /api/info` - Server information

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Variables
```bash
PORT=3000 npm start
```

## 📚 Learn More

- [Clovie Documentation](https://github.com/adrianjonmiller/clovie)
- [Nunjucks Template Guide](https://mozilla.github.io/nunjucks/)
- [Database API Reference](https://github.com/adrianjonmiller/clovie#database)

## 🤝 Contributing

Found a bug or want to contribute? Issues and pull requests are welcome!

## 📝 License

MIT
