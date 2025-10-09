export default {
  // Zero config - Clovie auto-detects your project structure!
  // views/, scripts/, styles/, assets/, partials/ all detected automatically
  
  data: {
    title: '{{projectName}}',
    description: 'A modern website built with Clovie',
    author: 'Your Name'
  }
  
  // 🎯 Ready to add more? Uncomment these examples:
  
  // Dynamic pages from data
  // routes: [{
  //   name: 'Blog Posts',
  //   path: '/posts/:slug',
  //   template: 'post.html',
  //   repeat: (data) => data.posts, // Generate page for each post
  //   data: (globalData, post) => ({ ...globalData, post })
  // }],
  
  // Custom template engine
  // renderEngine: (template, data) => {
  //   return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  //     return data[key] || match;
  //   });
  // }
};