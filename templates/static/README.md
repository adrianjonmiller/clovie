# {{projectName}}

A fast, modern static site built with [Clovie](https://github.com/adrianjonmiller/clovie).

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Build static files for deployment
npm run build

# Preview production build
npm run preview
```

## ✨ Features

- **⚡ Lightning Fast**: Generates optimized static HTML files
- **🎨 Modern CSS**: SCSS compilation with auto-prefixing
- **📱 Responsive**: Mobile-first responsive design
- **🔍 SEO Ready**: Semantic HTML and meta tags
- **📦 Optimized**: Minified assets and smart caching
- **🚀 Deploy Anywhere**: Works with any static hosting

## 📁 Project Structure

```
{{projectName}}/
├── clovie.config.js    # Static site configuration
├── views/              # HTML templates
│   ├── index.html     # Homepage
│   └── about.html     # About page
├── partials/           # Reusable components
│   ├── header.html    # Site header
│   └── footer.html    # Site footer
├── scripts/            # JavaScript
│   └── main.js        # Main JS entry point
├── styles/             # SCSS stylesheets
│   └── main.scss      # Main stylesheet
├── assets/             # Static assets (images, fonts, etc.)
└── dist/               # Generated static files
```

## 🎯 Static Site Optimizations

This template is configured for optimal static site generation:

- **SEO Metadata**: Proper meta tags and structured data
- **Performance**: Minified assets and optimized builds
- **Accessibility**: Semantic HTML and ARIA labels
- **Analytics Ready**: Easy Google Analytics integration

## 🔧 Configuration Examples

### Add Blog Posts from Markdown
```javascript
// clovie.config.js
export default {
  type: 'static',
  
  data: async () => {
    const posts = await loadMarkdownFiles('./content/posts/');
    return {
      site: { title: '{{projectName}}' },
      posts: posts.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  },
  
  routes: [{
    name: 'Blog Posts',
    path: '/posts/:slug',
    template: 'post.html',
    repeat: (data) => data.posts,
    data: (globalData, post) => ({
      ...globalData,
      post,
      title: `${post.title} - ${globalData.site.title}`
    })
  }]
};
```

### Add Multiple Page Types
```javascript
export default {
  data: {
    posts: [...],
    projects: [...],
    categories: [...]
  },
  
  routes: [
    // Blog posts
    {
      path: '/blog/:slug',
      template: 'post.html',
      repeat: (data) => data.posts,
      data: (globalData, post) => ({ ...globalData, post })
    },
    
    // Project pages
    {
      path: '/projects/:slug',
      template: 'project.html', 
      repeat: (data) => data.projects,
      data: (globalData, project) => ({ ...globalData, project })
    },
    
    // Category listing pages
    {
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

### Environment-Specific Configuration
```javascript
export default {
  type: 'static',
  
  data: {
    site: {
      title: '{{projectName}}',
      url: process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com'
        : 'http://localhost:3000'
    }
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    minify: true,
    generateSitemap: true
  })
};
```

## 🌐 Deployment

### Netlify (Recommended)
1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages
```bash
npm run build
# Push dist/ contents to gh-pages branch
```

### Manual Deployment
Upload the entire `dist/` folder to your web server.

## 🔧 Available Commands

```bash
npm run dev      # Development server with live reload
npm run build    # Build static files for production
npm run preview  # Preview production build locally
npm run clean    # Clean build output
```

## 📊 Performance Tips

- **Images**: Optimize images before adding to `assets/`
- **Fonts**: Use web fonts or system fonts for best performance
- **JavaScript**: Keep client-side JS minimal for static sites
- **CSS**: Use SCSS features for maintainable stylesheets

## 📚 Learn More

- [Clovie Documentation](https://github.com/adrianjonmiller/clovie)
- [Static Site Best Practices](https://web.dev/static-site-generation/)
- [JAMstack Resources](https://jamstack.org/resources/)

---

*Static sites done right with Clovie ⚡*