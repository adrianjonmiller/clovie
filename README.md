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
- **Development Server**: Live reload with Browser-Sync and file watching
- **Data-Driven Pages**: Model system for dynamic page generation
- **Pagination Support**: Built-in pagination for data-driven content

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
  
  // Custom compiler (optional - Clovie has a good default)
  compiler: (template, data) => {
    return yourTemplateEngine(template, data);
  }
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

### Data Models & Dynamic Pages

Create multiple pages from data arrays using the models system:

```javascript
// clovie.config.js
export default {
  // ... other config
  data: {
    title: 'My Blog',
    posts: [
      { id: 1, title: 'First Post', content: 'Hello World' },
      { id: 2, title: 'Second Post', content: 'Another post' },
      { id: 3, title: 'Third Post', content: 'Yet another' }
    ]
  },
  models: {
    posts: {
      template: '_post.html',        // Template to use
      paginate: 2,                   // Posts per page (optional)
      output: (post, index) => {     // Custom output filename
        return `post-${post.id}.html`;
      },
      transform: (post, index) => {  // Transform data before rendering
        return {
          ...post,
          excerpt: post.content.substring(0, 100) + '...',
          date: new Date().toISOString()
        };
      }
    }
  }
};
```

**Template (`_post.html`):**
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{local.title}} - {{title}}</title>
</head>
<body>
  <article>
    <h1>{{local.title}}</h1>
    <p>{{local.excerpt}}</p>
    <div>{{local.content}}</div>
  </article>
</body>
</html>
```

**Output:**
- `post-1.html` - First post page
- `post-2.html` - Second post page  
- `post-3.html` - Third post page

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

### Pagination

The models system includes built-in pagination:

```javascript
export default {
  // ... other config
  models: {
    blog: {
      template: '_blog.html',
      paginate: 5,  // 5 posts per page
      output: (posts, pageNum) => {
        return pageNum === 0 ? 'blog.html' : `blog-${pageNum + 1}.html`;
      }
    }
  }
};
```

**Output:**
- `blog.html` - First 5 posts
- `blog-2.html` - Next 5 posts
- `blog-3.html` - Remaining posts

### Data Transformation

Transform data before rendering with custom functions:

```javascript
export default {
  // ... other config
  models: {
    products: {
      template: '_product.html',
      transform: (product, index) => {
        return {
          ...product,
          price: `$${product.price.toFixed(2)}`,
          slug: product.name.toLowerCase().replace(/\s+/g, '-'),
          inStock: product.quantity > 0
        };
      }
    }
  }
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
2. **Validate data structures** before passing to models
3. **Handle async data** with proper error catching
4. **Use meaningful output filenames** for SEO and organization
5. **Transform data** in the model configuration, not in templates

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

**"Data for model must be an array"**
- Check that your data structure matches the model configuration
- Ensure the referenced data key contains an array

**"Maximum directory depth exceeded"**
- Check for circular symlinks or extremely deep directory structures
- The limit is 50 levels deep (configurable in code)

**Build failures**
- Check console output for specific error messages
- Verify all referenced files exist
- Ensure template syntax matches your compiler

## License

MIT
