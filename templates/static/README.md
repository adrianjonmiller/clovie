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
```

## ✨ Features

- **⚡ Lightning Fast**: Generates optimized static HTML files
- **🎨 Nunjucks Templates**: Powerful Jinja2-like templating (Handlebars, Pug, Eta also supported)
- **📱 Responsive**: Mobile-first responsive design
- **🔍 SEO Ready**: Semantic HTML and meta tags
- **📦 Optimized**: Minified assets and smart caching
- **🚀 Deploy Anywhere**: Works with any static hosting

## 📁 Project Structure

```
{{projectName}}/
├── clovie.config.js    # Static site configuration
├── views/              # Nunjucks templates
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
  renderEngine: 'nunjucks',
  
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
    data: (globalData, post, key) => ({
      ...globalData,
      post,
      title: `${post.title} - ${globalData.site.title}`
    })
  }]
};
```

### Generate Category Pages
```javascript
routes: [
  {
    name: 'Category Pages',
    path: '/category/:slug',
    template: 'category.html',
    repeat: (data) => data.categories,
    data: (globalData, category, key) => ({
      ...globalData,
      category,
      posts: globalData.posts.filter(p => p.category === category.slug)
    })
  }
]
```

## 🎨 Template Engine

Uses **Nunjucks** by default (Jinja2-like syntax):

```html
{% extends "layout.html" %}

{% block content %}
  <h1>{{ site.title }}</h1>
  
  {% for post in posts %}
    <article>
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt }}</p>
    </article>
  {% endfor %}
{% endblock %}
```

Switch to Handlebars, Pug, or Eta:
```javascript
renderEngine: 'handlebars'  // or 'pug', 'eta'
```

## 🌐 Deployment

This is a static site that can be deployed anywhere:

### Netlify
```bash
npm run build
# Drag and drop the dist/ folder to Netlify
```

### Vercel
```bash
# Connect your Git repository
# Build command: npm run build
# Output directory: dist
```

### GitHub Pages
```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

### Any Static Host
Just upload the `dist/` folder contents to your hosting provider.

## 📚 Learn More

- [Clovie Documentation](https://github.com/adrianjonmiller/clovie)
- [Nunjucks Template Guide](https://mozilla.github.io/nunjucks/)
- [Configuration Guide](https://github.com/adrianjonmiller/clovie#configuration)

---

*Built with ❤️ using Clovie*
