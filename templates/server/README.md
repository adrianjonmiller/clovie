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
- 🛣️ **API Endpoints** - RESTful JSON APIs
- 📄 **Server-Side Rendering** with Nunjucks templates
- 🔄 **Live Reload** during development
- 🎨 **Asset Pipeline** for CSS/JS processing
- ⚡ **Zero Dependencies** - Works out of the box

## 📁 Project Structure

```
{{projectName}}/
├── clovie.config.js       # Server configuration with API routes
├── package.json           # Dependencies and scripts
├── views/                 # Server-rendered templates (Nunjucks)
│   ├── index.html        # Homepage
│   └── about.html        # About page
├── partials/              # Reusable template components
│   ├── header.html       # Site header with navigation
│   └── footer.html       # Site footer
├── scripts/               # Client-side JavaScript
│   └── app.js            # Main app
└── styles/                # SCSS stylesheets
    └── main.scss         # Modern, clean styles
```

## 🛣️ API Endpoints

### Server Status
```
GET /api/status
Response: { status, timestamp, uptime, version }
```

### Example API Usage
```javascript
// Get server status
const status = await fetch('/api/status').then(r => r.json());
```

## 📄 Server Routes

- **`/`** - Homepage
- **`/about`** - About page explaining server features

## ⚙️ Configuration

### API Route Configuration
```javascript
api: [{
  path: '/api/hello',
  method: 'GET',
  handler: async (ctx) => {
    return ctx.respond.json({ message: 'Hello!' });
  }
}]
```

### Server-Side Rendered Routes
```javascript
routes: [{
  path: '/dashboard',
  template: './views/dashboard.html',
  data: async ({ context }) => {
    return {
      title: 'Dashboard',
      user: context.req.user
    };
  }
}]
```

## 🎨 Template Engine

Uses **Nunjucks** by default (Jinja2-like syntax):

```html
{% extends "layout.html" %}

{% block content %}
  <h1>{{ title }}</h1>
  
  {% for item in items %}
    <article>{{ item.title }}</article>
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
  adapter: 'express',
  
  middleware: [
    express.json(),
    express.urlencoded({ extended: true }),
    express.static('public')
  ],
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

## 🤝 Contributing

Found a bug or want to contribute? Issues and pull requests are welcome!

## 📝 License

MIT
