require('dotenv').config();
const nunjucks = require('nunjucks');
const fetch = require('node-fetch');
const token = process.env.DATO_TOKEN;

nunjucks.configure('./views', {
  watch: process.env.NODE_ENV === 'dev'
});

module.exports = {
  data: new Promise(result => {
    fetch(
      'https://graphql.datocms.com/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `{
            allPhotos {
              title
              photo {
                url
                alt
              }
            }
          }`
        }),
      }
    )
    .then(res => res.json())
    .then(res => {
      result(res.data)
    })
    .catch((error) => {
      reject(error)
    })
  }),
  models: {
    allPhotos: {
      template: '_article.html',
      output: (val) => {
        return 'articles/' + val.title.toLowerCase() + '.html'
      },
      transform: (val) => {
        return val
      }
    }
  },
  compiler: (template, data) => {
    console.log(data)
    return nunjucks.renderString(template, data);
  }
};