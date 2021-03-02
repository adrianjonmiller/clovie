const path = require('path');
const Mustache = require('mustache');

module.exports = {
  scripts: path.join('./scripts/main.js'),
  styles: path.join('./styles/main.scss'),
  views: path.join('./views'),
  assets: path.join('./assets'),
  outputDir: path.resolve('./dist/'),
  data: {
    title: 'Mustache templates'
  },
  models: {},
  compiler: (template, data) => {
    return Mustache.render(template, data);
  }
}