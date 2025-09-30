# Clovie - Vintage Web Dev Tooling

A Node.js-based static site generator designed to be simple, fast, and highly modular. The "Hollow Knight of Web Dev" - simple but deep, easy to start but room to grow.

## Project Structure

```
packages/clovie/
├── __tests__/           # Test files
│   └── index.test.js
├── bin/                 # CLI executable
│   └── cli.js
├── config/              # Configuration files
│   └── default.config.js
├── lib/                 # Source code
│   ├── core/           # Core functionality
│   │   ├── index.js    # Main Clovie class
│   │   ├── bundler.js  # JavaScript bundling
│   │   ├── render.js   # Template rendering
│   │   ├── write.js    # File writing
│   │   ├── getViews.js # View processing
│   │   ├── getData.js  # Data loading
│   │   ├── getStyles.js # SCSS compilation
│   │   └── getAssets.js # Asset processing
│   └── utils/          # Utility functions
│       ├── clean.js    # Directory cleaning
│       └── create.js   # Project creation
└── package.json
```

## Core Features

- **Template Engine Agnostic**: Support for Handlebars, Nunjucks, Pug, Mustache, or custom engines
- **Asset Processing**: JavaScript bundling with esbuild, SCSS compilation, static asset copying  
- **Development Server**: Live reload with Express and file watching
- **Dynamic Routing**: Powerful route system for both static and server-side page generation
- **Server-Side Rendering**: Full Express applications with dynamic routes and API endpoints
- **Incremental Builds**: Smart caching for faster rebuilds
- **Auto-Discovery**: Intelligent project structure detection

## Usage

### Installation

#### Option 1: Local Installation (Recommended)
```bash
# Install as dev dependency in your project
npm install --save-dev clovie

# Use via npm scripts
npm run build
npm run dev
```

#### Option 2: Global Installation
```bash
# Install globally
npm install -g clovie
```

### Creating New Projects

#### Using Clovie CLI (Recommended)
```bash
# Create a new project
npx clovie create my-site

# Or with global install
clovie create my-site
```



### Building and Development

```bash
# Build the site
clovie build
# or
npm run build

# Start development server with file watching
clovie watch
# or
npm run dev
```

## Configuration

### Minimal Configuration (Recommended)

Clovie uses smart defaults and auto-detection, so you can start with just:

```javascript
export default {
  data: {
    title: 'My Site'
  }
};
```

Clovie will automatically detect:
- `views/` directory for HTML templates
- `scripts/main.js` for JavaScript entry point
- `styles/main.scss` for SCSS entry point
- `assets/` directory for static files

### Full Configuration

If you need custom paths or behavior:

```javascript
export default {
  // Custom paths (optional - Clovie will auto-detect if not specified)
  scripts: './src/js/app.js',
  styles: './src/css/main.scss',
  views: './templates',
  assets: './public',
  outputDir: './build',
  
  // Your data
  data: {
    title: 'My Site'
  },
  
  // Routes for dynamic pages from data
  routes: [{
    name: 'Blog Posts',
    path: '/posts/:slug',
    template: 'post.html',
    repeat: (state) => state.get(['posts']),
    data: (state, post) => ({ 
      ...post, 
      title: post.title,
      slug: post.slug 
    })
  }]
};
```

### Server Application Configuration  

```javascript
export default {
  type: 'server', // Express application mode
  
  port: 3000,
  outputDir: './dist', // Serve static files from here
  
  // Same view/asset processing as static mode
  views: './src/views',
  scripts: './src/js', 
  styles: './src/scss',
  
  // Server-specific routes
  routes: [{
    name: 'Posts API',
    path: '/api/posts',
    method: 'GET',
    handler: async (req, res) => {
      const posts = await getPosts();
      res.json(posts);
    }
  }, {
    name: 'Post Pages',
    path: '/posts/:slug',
    template: 'post.html',
    data: async (state, params) => {
      const post = await getPost(params.slug);
      return { post };
    }
  }],
  
  // API routes
  api: [{
    path: '/api/users',
    method: 'POST',
    handler: async (req, res) => {
      const user = await createUser(req.body);
      res.json(user);
    }
  }],
  
  // Express middleware
  middleware: [
    express.json(),
    cors()
  ]
};
```

## Advanced Features

### Async Data Loading

Clovie supports asynchronous data loading for dynamic content:

```javascript
// clovie.config.js
export default {
  // ... other config
  data: async () => {
    // Fetch data from API
    const response = await fetch('https://api.example.com/posts');
    const posts = await response.json();
    
    return {
      title: 'My Blog',
      posts: posts,
      timestamp: new Date().toISOString()
    };
  }
};
```

### Dynamic Routes & Data-Driven Pages

Create multiple pages from data arrays using the routes system:

```javascript
// clovie.config.js
export default {
  // ... other config
  data: {
    title: 'My Blog',
    posts: [
      { id: 1, title: 'First Post', content: 'Hello World', slug: 'first-post' },
      { id: 2, title: 'Second Post', content: 'Another post', slug: 'second-post' },
      { id: 3, title: 'Third Post', content: 'Yet another', slug: 'third-post' }
    ]
  },
  routes: [{
    name: 'Blog Posts',
    path: '/posts/:slug',
    template: 'post.html',
    repeat: (state) => state.get(['posts']),
    data: (state, post) => ({
      ...post,
      excerpt: post.content.substring(0, 100) + '...',
      date: new Date().toISOString()
    })
  }]
};
```

**Template (`post.html`):**
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}} - {{../title}}</title>
</head>
<body>
  <article>
    <h1>{{title}}</h1>
    <p>{{excerpt}}</p>
    <div>{{content}}</div>
  </article>
</body>
</html>
```

**Output:**
- `posts/first-post.html` - First post page
- `posts/second-post.html` - Second post page  
- `posts/third-post.html` - Third post page

### Custom Template Engines

Clovie is template-engine agnostic. Here are examples for popular engines:

#### Handlebars
```javascript
import Handlebars from 'handlebars';

export default {
  // ... other config
  compiler: (template, data) => {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }
};
```

#### Nunjucks
```javascript
import nunjucks from 'nunjucks';

export default {
  // ... other config
  compiler: (template, data) => {
    return nunjucks.renderString(template, data);
  }
};
```

#### Pug
```javascript
import pug from 'pug';

export default {
  // ... other config
  compiler: (template, data) => {
    return pug.render(template, { ...data, pretty: true });
  }
};
```

#### Custom Engine
```javascript
export default {
  // ... other config
  compiler: (template, data) => {
    // Simple variable replacement
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
};
```

### Route Pagination

Routes support built-in pagination for large datasets:

```javascript
export default {
  // ... other config
  routes: [{
    name: 'Blog Pagination',
    path: '/blog/:page?',
    template: 'blog.html',
    paginate: 5,  // 5 posts per page
    repeat: (state) => state.get(['posts']),
    data: (state, posts, pageInfo) => ({
      posts,
      pagination: pageInfo,
      title: `Blog - Page ${pageInfo.current}`
    })
  }]
};
```

**Output:**
- `blog.html` - First 5 posts (page 1)
- `blog/2.html` - Next 5 posts (page 2)
- `blog/3.html` - Remaining posts (page 3)

### Data Transformation in Routes

Transform data before rendering using the `data` function:

```javascript
export default {
  // ... other config
  routes: [{
    name: 'Products',
    path: '/products/:slug',
    template: 'product.html',
    repeat: (state) => state.get(['products']),
    data: (state, product) => ({
      ...product,
      price: `$${product.price.toFixed(2)}`,
      slug: product.name.toLowerCase().replace(/\s+/g, '-'),
      inStock: product.quantity > 0,
      relatedProducts: state.get(['products']).filter(p => 
        p.category === product.category && p.id !== product.id
      )
    })
  }]
};
```

## Error Handling & Best Practices

### Error Handling

Clovie includes robust error handling for common issues:

- **Missing directories**: Gracefully handles missing views, scripts, or assets folders
- **File read errors**: Continues processing even if individual files fail
- **Template errors**: Provides clear error messages for compilation failures
- **Data validation**: Warns about invalid data structures

### Progress Indicators

Clovie provides clear feedback during builds:

```
🚀 Starting build...
🧹 Cleaning output directory...
📊 Loading data...
   Loaded 2 data sources
📝 Processing views...
   Processed 5 views
🎨 Rendering templates...
   Rendered 5 templates
⚡ Bundling scripts...
   Bundled 1 script files
🎨 Compiling styles...
   Compiled 1 style files
📦 Processing assets...
   Processed 3 asset files
💾 Writing files...
✅ Build completed in 45ms
```

### Auto-Discovery

Clovie automatically detects common project structures:

```
🔍 Auto-detected views directory: views
🔍 Auto-detected scripts entry: scripts/main.js
🔍 Auto-detected styles entry: styles/main.scss
🔍 Auto-detected assets directory: assets
```

### Best Practices

1. **Use partial templates** (files starting with `_`) for reusable components
2. **Validate data structures** before passing to routes
3. **Handle async data** with proper error catching in route data functions
4. **Use meaningful route paths** for SEO and organization
5. **Transform data** in route data functions, not in templates
6. **Separate static and dynamic routes** for better performance

### Project Structure

When you create a new project with `clovie create`, you get this structure:

```
my-site/
├── clovie.config.js          # Configuration
├── package.json           # Dependencies and scripts
├── README.md              # Project documentation
├── views/                 # HTML templates
│   └── index.html        # Home page template
├── scripts/              # JavaScript
│   └── main.js          # Main script file
├── styles/               # SCSS
│   └── main.scss        # Main stylesheet
└── assets/               # Static files (images, etc.)
```

#### Custom Project Structure
You can also create your own structure:

```
my-site/
├── clovie.config.js          # Configuration
├── views/                 # Templates
│   ├── _base.html        # Base template (partial)
│   ├── _header.html      # Header partial
│   ├── index.html        # Home page
│   └── _post.html        # Post template (partial)
├── scripts/              # JavaScript
│   └── main.js
├── styles/               # SCSS
│   └── main.scss
├── assets/               # Static files
│   └── images/
└── data/                 # Data files (optional)
    └── posts.json
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### Common Issues

**"Views directory does not exist"**
- Ensure the `views` path in your config is correct
- Create the views directory if it doesn't exist

**"Route repeat function must return an array"**
- Check that your route's repeat function returns an array
- Ensure the data structure matches the route configuration

**"Maximum directory depth exceeded"**
- Check for circular symlinks or extremely deep directory structures
- The limit is 50 levels deep (configurable in code)

**Build failures**
- Check console output for specific error messages
- Verify all referenced files exist
- Ensure template syntax matches your compiler

## License

MIT
