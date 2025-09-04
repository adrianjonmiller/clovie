export default {
  // Clovie will auto-detect these paths!
  // Just add your data and models below
  
  data: {
    title: '{{projectName}}'
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
  
  // Custom compiler (optional - Clovie has a good default)
  // compiler: (template, data) => {
  //   return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
  //     return data[key] || match;
  //   });
  // }
};
