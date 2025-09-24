import Handlebars from 'handlebars';
import path from 'path';

export default {
  // Static mode - generates static files
  mode: 'static',
  
  // Basic configuration
  views: './views',
  outputDir: './dist',
  
  // Global data available to all routes
  data: {
    siteName: 'My Clovie Site',
    description: 'A site built with Clovie routing'
  },
  
  // Routes configuration
  routes: [
    {
      path: '/',
      name: 'home',
      view: 'index.html',
      data: () => ({
        title: 'Welcome Home',
        message: 'This is the home page'
      })
    },
    {
      path: '/about',
      name: 'about', 
      view: 'about.html',
      data: () => ({
        title: 'About Us',
        content: 'Learn more about our company'
      })
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      view: 'blog-post.html',
      data: async (params) => {
        // Simulate fetching blog post data
        return {
          title: `Blog Post: ${params.slug}`,
          slug: params.slug,
          content: `This is the content for ${params.slug}`
        };
      }
    }
  ],
  
  // Template compiler
  compiler: (template, data) => {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (err) {
      console.warn(`⚠️  Template compilation error: ${err.message}`);
      return template;
    }
  }
};