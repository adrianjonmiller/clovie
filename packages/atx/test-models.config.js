export default {
  scripts: './test-scripts/main.js',
  styles: './test-styles/main.scss',
  views: './test-views',
  assets: './test-assets',
  outputDir: './dist',
  data: {
    title: 'Test Blog',
    posts: [
      { id: 1, title: 'First Post', content: 'Hello World', slug: 'first-post' },
      { id: 2, title: 'Second Post', content: 'Another post', slug: 'second-post' }
    ]
  },
  models: {
    posts: {
      template: '_post.html',
      output: 'post-{slug}.html',
      transform: (post) => ({
        ...post,
        excerpt: post.content.substring(0, 10) + '...'
      })
    }
  },
  compiler: (template, data) => {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
};
