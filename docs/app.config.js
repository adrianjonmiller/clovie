export default {
  // Clovie will auto-detect these paths!
  // Just add your data and models below
  
  data: {
    title: 'Clovie',
    description: 'Vintage web dev tooling with modern quality of life',
    version: '0.0.23',
    features: [
      'Simple & Fast',
      'Smart Defaults',
      'Auto-Discovery',
      'Live Reload',
      'Template Agnostic',
      'Asset Processing'
    ],
    examples: [
      { name: 'Basic Site', description: 'Simple static site' },
      { name: 'Blog', description: 'Blog with posts' },
      { name: 'Portfolio', description: 'Portfolio showcase' }
    ]
  },
  
  // Custom compiler (optional - Clovie has a good default)
  // compiler: (template, data) => {
  //   return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
  //     return data[key] || match;
  //   });
  // }
};
