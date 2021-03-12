module.exports = [
{ name: 'command',
  defaultOption: true
},
{ name: 'build',
  alias: 'b',
  type: Boolean,
},
{ name: 'config',
  alias: 'c',
  type: String,
  defaultValue: 'app.config.js'
},{
  name: 'watch',
  alias: 'w',
  type: Boolean
},{
  name: 'create',
  type: String,
}];