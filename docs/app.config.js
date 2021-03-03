require('dotenv').config();
const nunjucks = require('nunjucks');
const path  = require('path');
const token = process.env.DATO_TOKEN;
const templatesPath = path.join('./views/nunjucks');
const data = require('./database')

nunjucks.configure(templatesPath, {
  watch: process.env.NODE_ENV === 'dev'
});

module.exports = {
  data: data(token),
  models: {},
  views: templatesPath,
  compiler: (template, data) => {
    return nunjucks.renderString(template, data);
  }
};