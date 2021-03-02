const path = require('path');
const Handlebars = require('handlebars');

module.exports = {
  scripts: path.join('./scripts/main.js'),
  styles: path.join('./styles/main.scss'),
  views: path.join('./views'),
  assets: path.join('./assets'),
  outputDir: path.resolve('./dist/'),
  data: {},
  models: {},
  compiler: (template, data) => {
    let compiled = Handlebars.compile(template);
    return compiled(data);
  }
}