const query = require('./query.graphql');
const fetch = require('node-fetch');

module.exports = (token) => new Promise(result => {
  fetch(
    'https://graphql.datocms.com/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({query}),
    }
  )
  .then(res => res.json())
  .then(res => {
    result(res.data)
  })
  .catch((error) => {
    reject(error)
  })
})