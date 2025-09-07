const path = require('path');
const Handlebars = require('handlebars');

module.exports = {
  scripts: path.join('./scripts/main.js'),
  styles: path.join('./styles/main.scss'),
  views: path.join('./views'),
  assets: path.join('./assets'),
  partials: path.resolve('./partials'),  // Directory containing partial templates
  outputDir: path.resolve('./dist/'),
  data: {
    title: 'Handlebars templates with partials',
    description: 'This example demonstrates the new partials directory system'
  },
  models: {},
  
  // Partials registration function
  register: (name, template) => {
    Handlebars.registerPartial(name, template);
  },
  
  // Template compiler
  compiler: (template, data) => {
    let compiled = Handlebars.compile(template);
    return compiled(data);
  }
}