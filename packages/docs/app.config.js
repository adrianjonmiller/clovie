require('dotenv').config();
const nunjucks = require('nunjucks');
const path  = require('path');
const token = process.env.DATO_TOKEN;
const templatesPath = path.join('./views/nunjucks');
const data = require('./data')

nunjucks.configure(templatesPath, {
  watch: process.env.NODE_ENV === 'dev'
});

module.exports = {
  data: {
    title: 'ATX',
    description: 'Simple, fast, mod-able static site generator'
  },
  models: [
    {
      ref: 'test',
      template: '_article.html',
      paginate: 2,
      output: (data, i, prev, next) => {
        console.log(i, prev, next);
        return i + '.html'
      }
    }
  ],
  views: templatesPath,
  compiler: (template, data) => {
    return nunjucks.renderString(template, data);
  }
};