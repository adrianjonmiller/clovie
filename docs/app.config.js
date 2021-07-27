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
    test: [1,2,3,4,5]
  },
  models: {
    test: {
      paginate: 2
    }
  },
  views: templatesPath,
  compiler: (template, data) => {
    return nunjucks.renderString(template, data);
  }
};