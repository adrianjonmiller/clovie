# ATX

#### Installation

```
yarn
```

#### Watch/dev command

```
yarn watch
```

#### Build

```
yarn build
```

### Data
#### Static data object
```
module.exports = {
  data: {
      name: 'Awesome site'
  }, 
  models: {},
  compiler: () => {/* HTML Compiler */}
}
```

#### Return data with function
```
module.exports = {
  data: () => {
      return {
          name: 'Awesome website'
      }
  }, 
  models: {},
  compiler: () => {/* HTML Compiler */}
}
```

#### Fetching data with promise
```
module.exports = {
  data: fetch('https://jsonplaceholder.typicode.com/todos/1').then(response => response.json()), 
  models: {},
  compiler: () => {/* HTML Compiler */}
}
```

### Compilers
#### Using handlebars compiler

Installation
```
yarn add handlebars
```

app.config.js
```
import Handlebars from 'handlebars'

module.exports = {
  data: {},
  models: {},
  compiler: (source, data) => {
      var template = Handlebars.compile(source);
      return template(data)
  }
}
```


### Models
#### Creating a new page for each item in 'post'

app.config.js
```
module.exports = {
  data: {},
  models: {
      'posts': {
          template: 'posts.html',
          transform: (data) => {
                data.url = 'articles/' + stringToReadableURL(data.title) + '.html';
                return data
          }
      }
  },
  compiler: () => {/* HTML Compiler */}
}
```
