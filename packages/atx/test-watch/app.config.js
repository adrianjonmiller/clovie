export default {
  // ATX will auto-detect these paths!
  // Just add your data and models below
  
  data: {
    title: 'test-watch'
  },
  
  // Example models (uncomment to use):
  // models: {
  //   posts: {
  //     template: '_post.html',
  //     output: 'post-{slug}.html',
  //     transform: (post) => ({
  //       ...post,
  //       excerpt: post.content.substring(0, 100) + '...'
  //     })
  //   }
  // }
  
  // Custom compiler (optional - ATX has a good default)
  // compiler: (template, data) => {
  //   return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
  //     return data[key] || match;
  //   });
  // }
};
