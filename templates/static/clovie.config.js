export default {
  // Static site optimized configuration
  type: 'static',
  
  data: {
    title: '{{projectName}}',
    description: 'A fast static site built with Clovie',
    author: 'Your Name',
    url: 'https://your-domain.com',
    buildDate: new Date().toISOString()
  },
  
  // Example blog/content models (uncomment to use):
  // models: {
  //   posts: {
  //     template: '_post.html',
  //     output: 'posts/{slug}.html',
  //     transform: (post) => ({
  //       ...post,
  //       excerpt: post.content.substring(0, 150) + '...',
  //       readingTime: Math.ceil(post.content.split(' ').length / 200)
  //     })
  //   },
  //   pages: {
  //     template: '_page.html', 
  //     output: '{slug}.html'
  //   }
  // },

  // SEO and performance optimizations
  minify: true,
  generateSitemap: true,
  
  // Custom compiler with SEO enhancements
  // compiler: (template, data) => {
  //   return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
  //     return data[key] || match;
  //   });
  // }
};
