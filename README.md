# ATX - extensible static site generator.

#### Installation

```
yarn add atx
```

#### app.config.js file

```
{
  scripts: path.join('./scripts/index.js'), // Path to script entry file
  styles: path.join('./styles'), // Path to Sass entry file
  views: path.join('./views'), // Path to views directory
  outputDir: path.resolve('./dist/'), // Path to output directory
  data: {}, // Data goes here, can be either obect or Promise
  compiler: (template, data) => { return somecompiler.output() } // Retern the result of compiler ex: nunucks, handlebars, liquid etc.
}

```

#### Build

```
npm atx
```

#### Watch

```
npm atx --watch
```

or

```
npm atx -w
```
