---
sidebar_position: 7
title: Routes & dynamic pages
description: Generate multiple static pages from data arrays or handle dynamic server-rendered requests using the routes array.
---

# Routes & Dynamic Pages

Routes generate multiple pages from data in static mode, or handle dynamic requests in server mode.

## Route Object Structure

```javascript
{
  name: 'Display Name',          // Optional: Route description
  path: '/posts/:slug',          // URL pattern with parameters
  template: 'post.html',         // Template file to render
  method: 'GET',                 // HTTP method (server mode only)
  repeat: (data) => data.posts,  // Generate multiple pages from array
  data: (globalData, item, params) => ({}) // Data function for template
}
```

## Static Route Examples

```javascript
export default {
  type: 'static',
  
  data: {
    posts: [/* ... */],
    categories: [/* ... */],
    tags: [/* ... */]
  },
  
  routes: [
    // Individual posts
    {
      name: 'Blog Posts',
      path: '/posts/:slug',
      template: 'post/single.html',
      repeat: (data) => data.posts,
      data: (globalData, post) => ({
        ...globalData,
        post,
        title: post.title,
        relatedPosts: globalData.posts
          .filter(p => p.category === post.category && p.id !== post.id)
          .slice(0, 3)
      })
    },
    
    // Category pages
    {
      name: 'Category Pages',
      path: '/category/:category',
      template: 'category/index.html',
      repeat: (data) => data.categories,
      data: (globalData, category) => ({
        ...globalData,
        category,
        posts: globalData.posts.filter(p => p.category === category),
        title: `${category} Posts`
      })
    },
    
    // Tag pages with pagination
    {
      name: 'Tag Pages',
      path: '/tag/:tag/:page?',
      template: 'tag/index.html',
      repeat: (data) => data.tags,
      paginate: 10,
      data: (globalData, tag, pageInfo) => ({
        ...globalData,
        tag,
        posts: globalData.posts.filter(p => p.tags.includes(tag)),
        pagination: pageInfo
      })
    }
  ]
};
```

## Server Route Examples

```javascript
export default {
  type: 'server',
  
  routes: [
    // Server-rendered user profiles
    {
      name: 'User Profile',
      path: '/user/:id',
      template: 'user/profile.html',
      data: async (state, params) => {
        const user = await getUserById(params.id);
        const posts = await getUserPosts(params.id);
        const stats = await getUserStats(params.id);
        
        return {
          user,
          posts,
          stats,
          title: `${user.name}'s Profile`
        };
      }
    },
    
    // Dynamic product pages
    {
      name: 'Product Details',
      path: '/products/:category/:slug',
      template: 'product/details.html',
      data: async (state, params) => {
        const product = await getProductBySlug(params.category, params.slug);
        const related = await getRelatedProducts(product.id);
        
        return {
          product,
          related,
          breadcrumb: [
            { title: 'Products', url: '/products' },
            { title: params.category, url: `/products/${params.category}` },
            { title: product.name }
          ]
        };
      }
    }
  ]
};
```

For server routes that need access to engine services at startup, use [Factories](./factories) with `defineRoutes`.
