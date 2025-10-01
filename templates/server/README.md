# {{projectName}}

A server-side web application built with [Clovie](https://github.com/adrianjonmiller/clovie).

## Features

- 🌐 Express.js server with Clovie integration
- 🔌 API routes with state management  
- 📄 Server-side rendered views
- 🎨 Modern responsive UI
- 🔄 Live reload in development
- 📊 Built-in dashboard and user management
- ⚡ Real-time WebSocket support

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (with live reload)
npm run dev

# Start production server  
npm start
```

## Project Structure

```
├── views/              # Server-rendered templates
│   ├── index.html      # Homepage
│   ├── dashboard.html  # Admin dashboard
│   ├── login.html      # Login page
│   └── profile.html    # User profile page
├── scripts/            # Client-side JavaScript
│   └── app.js          # Main application logic
├── styles/             # SCSS stylesheets
│   └── main.scss       # Main styles with dashboard UI
├── partials/           # Reusable template components
│   ├── header.html     # Site header with user menu
│   ├── nav.html        # Sidebar navigation
│   └── footer.html     # Site footer
└── clovie.config.js    # Server configuration
```

## Available API Endpoints

This template includes these working API endpoints:

- `GET /api/status` - Server status and uptime
- `GET /api/users` - List all users with total count
- `POST /api/users` - Create a new user (requires name, email in body)
- `GET /api/users/:id` - Get specific user by ID

## Server Routes

- `/` - Homepage
- `/dashboard.html` - Admin dashboard  
- `/login.html` - Login page
- `/user/:id` - Dynamic user profile page (server-rendered)

## Configuration

The `clovie.config.js` file shows how to:

- Set up API routes with `action` functions
- Configure middleware with Express functions
- Create dynamic routes with templates and data functions
- Use Clovie's state management system

## State Management

Clovie provides a state system accessible in API actions and route data functions:

```javascript
// In API actions and route data functions:
const users = state.get('users') || [];
state.set('users', newUsersArray);
```

## Development

```bash
# Start with live reload
npm run dev
# Server runs at http://localhost:3000
# Live reload via WebSocket
```

## API Usage Examples

```javascript
// Get server status
fetch('/api/status')

// Create a user
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
})

// Get user by ID  
fetch('/api/users/123')
```

## Learn More

- [Clovie Documentation](https://github.com/adrianjonmiller/clovie)
- [Express.js Guide](https://expressjs.com/)
