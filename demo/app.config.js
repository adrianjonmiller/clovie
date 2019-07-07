const nunjucks = require('nunjucks');
const fetch = require('node-fetch');
const token = '65bd73f5a93d46397f2b027a16d8b1';
const path = require('path');

nunjucks.configure('./views', {
  watch: true
});

module.exports = {
  data: () => ({
    title: 'Attics'
  }),
  models: {},
  compiler: (template, data) => (nunjucks.renderString(template, data))
}