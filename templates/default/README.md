# {{projectName}}

A modern website built with [Clovie](https://github.com/adrianjonmiller/clovie) - vintage web dev tooling with modern quality of life.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:3000` to see your site!

## 📁 Project Structure

```
{{projectName}}/
├── clovie.config.js    # Configuration (zero config by default!)
├── package.json        # Dependencies and scripts
├── views/              # HTML templates
│   └── index.html     # Homepage
├── scripts/            # JavaScript
│   └── main.js        # Main JS entry point
├── styles/             # SCSS/CSS
│   └── main.scss      # Main stylesheet  
├── assets/             # Static files (images, fonts, etc.)
└── dist/               # Build output
```

## ✨ Features

- **🔄 Zero Config**: Clovie auto-detects your project structure
- **⚡ Live Reload**: Instant updates during development
- **🎨 SCSS Support**: Modern CSS with variables, nesting, and more
- **📦 Asset Processing**: JavaScript bundling with esbuild
- **🌐 Template Agnostic**: Use any template engine you prefer
- **🚀 Fast Builds**: Smart caching for quick rebuilds

## 🎯 Next Steps

Ready to add more functionality? Edit `clovie.config.js`:

### Add Dynamic Pages from Data
```javascript
export default {
  data: {
    title: '{{projectName}}',
    posts: [
      { title: 'My First Post', slug: 'first-post', content: '...' }
    ]
  },
  
  routes: [{
    name: 'Blog Posts',
    path: '/posts/:slug',
    template: 'post.html',
    repeat: (data) => data.posts,
    data: (globalData, post) => ({ ...globalData, post })
  }]
};
```

### Use a Template Engine
```javascript
import Handlebars from 'handlebars';

export default {
  // ... other config
  renderEngine: (template, data) => {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }
};
```

### Load Data Asynchronously  
```javascript
export default {
  data: async () => {
    const posts = await fetch('https://api.example.com/posts').then(r => r.json());
    return { title: '{{projectName}}', posts };
  }
};
```

## 🔧 Available Commands

```bash
npm run dev      # Development server with live reload
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## 🌐 Deployment

This is a static site that can be deployed anywhere:

- **[Netlify](https://netlify.com)**: Drag and drop the `dist/` folder
- **[Vercel](https://vercel.com)**: Connect your Git repository  
- **[GitHub Pages](https://pages.github.com)**: Push `dist/` to `gh-pages` branch
- **Any static host**: Upload the `dist/` folder contents

## 📚 Learn More

- [Clovie Documentation](https://github.com/adrianjonmiller/clovie)
- [Configuration Guide](https://github.com/adrianjonmiller/clovie#configuration)
- [Examples](https://github.com/adrianjonmiller/clovie/tree/main/examples)

---

*Built with ❤️ using Clovie*