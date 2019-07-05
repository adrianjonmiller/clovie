const nunjucks = require('nunjucks');
const fetch = require('node-fetch');
const token = '65bd73f5a93d46397f2b027a16d8b1';
const path = require('path');

module.exports = {
  scripts: path.join('./scripts/index.js'),
  styles: path.join('./styles/main.scss'),
  views: path.join('./views'),
  outputDir: path.resolve('./dist/'),
  data: function () {
    return new Promise (resolve => {
      fetch('https://graphql.datocms.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `{
            allWords {
              word
              example
            }
          }`
        }),
      }).then(res => res.json()).then((res) => {
        resolve(res.data)
      }).catch((error) => {
        console.log(error);
      });
    }) 
  },
  models: {
    'allWords': {
      template: 'templates/word.html'
    }
  },
  compiler: (template, data) => (nunjucks.renderString(template, data))
}