const path = require('path');
const nunjucks = require('nunjucks');

nunjucks.configure('./views', {
  watch: process.env.NODE_ENV === 'dev'
});

module.exports = {
  scripts: path.join('./scripts/main.js'),
  styles: path.join('./styles/main.scss'),
  views: path.join('./views'),
  assets: path.join('./assets'),
  outputDir: path.resolve('./dist/'),
  data: {
    title: 'Nunjucks templates'
  },
  models: {},
  compiler: (template, data) => {
    return nunjucks.renderString(template, data);
  }
}