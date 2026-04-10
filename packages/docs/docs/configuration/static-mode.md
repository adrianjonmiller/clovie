---
sidebar_position: 5
title: Static site mode
description: Build blogs, documentation, and marketing sites with static HTML generation, dynamic page creation, and async data loading.
---

# Static Site Mode

Perfect for blogs, documentation, and marketing sites.

## Basic Static Configuration

```javascript
export default {
  type: 'static', // Generate static HTML files
  
  data: {
    site: {
      title: 'My Blog',
      description: 'A fast static blog',
      url: 'https://myblog.com'
    },
    author: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  
  // Build optimizations
  minify: true,
  generateSitemap: true
};
```

## Static with Dynamic Pages

Generate multiple pages from data:

```javascript
export default {
  type: 'static',
  
  data: {
    posts: [
      { 
        id: 1, 
        title: 'Getting Started',
        slug: 'getting-started',
        content: 'Welcome to my blog...',
        date: '2024-01-01',
        category: 'tutorial'
      }
    ],
    categories: ['tutorial', 'guide', 'news']
  },
  
  routes: [
    // Individual post pages
    {
      name: 'Blog Posts',
      path: '/posts/:slug',
      template: 'post.html',
      repeat: (data) => data.posts,
      data: (globalData, post) => ({
        ...globalData,
        post,
        title: `${post.title} - ${globalData.site.title}`
      })
    },
    
    // Category listing pages  
    {
      name: 'Categories',
      path: '/category/:category',
      template: 'category.html',
      repeat: (data) => data.categories,
      data: (globalData, category) => ({
        ...globalData,
        category,
        posts: globalData.posts.filter(p => p.category === category)
      })
    }
  ]
};
```

## Async Data Loading

Load content from external sources at build time:

```javascript
export default {
  type: 'static',
  
  data: async () => {
    // Fetch from API
    const posts = await fetch('https://api.example.com/posts')
      .then(r => r.json());
    
    // Load from files
    const authors = await loadAuthorsFromFile('./data/authors.json');
    
    return {
      site: { title: 'My Blog' },
      posts,
      authors,
      buildTime: new Date().toISOString()
    };
  }
};
```

See [Routes & Dynamic Pages](./routes) for the full route object reference and more examples.
