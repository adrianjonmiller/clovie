---
sidebar_position: 3
title: Data & state management
description: Pass static data, load async data at build time, and use reactive server-side state in API handlers.
---

# Data & State Management

## Static Data

```javascript
export default {
  data: {
    // Site metadata
    site: {
      title: 'My Site',
      description: 'A great website',
      url: 'https://mysite.com'
    },
    
    // Navigation
    nav: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' }
    ],
    
    // Content data
    posts: [],
    projects: [],
    
    // Build info
    buildDate: new Date().toISOString()
  }
};
```

## Async Data (Static Mode)

```javascript
export default {
  data: async () => {
    try {
      // Multiple async operations
      const [posts, projects, config] = await Promise.all([
        loadPostsFromMarkdown('./content/posts/'),
        loadProjectsFromAPI('https://api.github.com/users/myuser/repos'),
        loadSiteConfig('./site.config.json')
      ]);
      
      return {
        ...config,
        posts,
        projects,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.warn('Data loading failed:', error);
      return { 
        posts: [], 
        projects: [],
        lastUpdated: Date.now()
      };
    }
  }
};
```

## Server State Management

In server mode, reactive **state** is available on the request context in API **`handler`** functions and in route **`data`** functions:

```javascript
api: [{
  path: '/api/users',
  method: 'POST',
  handler: async (ctx) => {
    const users = ctx.state.get('users') || [];
    const newUser = { id: Date.now(), ...(ctx.body || {}) };
    users.push(newUser);
    ctx.state.set('users', users);
    return ctx.respond.json({ success: true, user: newUser }, 201);
  }
}]
```

See [API Endpoints](./api-endpoints) for full handler examples using state.
