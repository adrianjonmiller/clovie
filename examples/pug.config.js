const path = require('path');
const pug = require('pug');

nunjucks.configure('./views', {
  watch: process.env.NODE_ENV === 'dev'
});

module.exports = {
  scripts: path.join('./scripts/main.js'),
  styles: path.join('./styles/main.scss'),
  views: path.join('./views'),
  assets: path.join('./assets'),
  outputDir: path.resolve('./dist/'),
  data: {},
  models: {},
  compiler: (template, data) => {
    const fn = pug.compile(template);
    return fn(data);;
  }
}