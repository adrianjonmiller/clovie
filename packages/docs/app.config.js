require('dotenv').config();
const nunjucks = require('nunjucks');
const path  = require('path');
const templatesPath = path.join('./views/nunjucks');

nunjucks.configure(templatesPath, {
  watch: process.env.NODE_ENV === 'dev'
});

module.exports = {
  data: {
    title: 'ATX',
    description: 'Simple, fast, mod-able static site generator'
  },
  models: {},
  views: templatesPath,
  compiler: (template, data) => {
    return nunjucks.renderString(template, data);
  }
};