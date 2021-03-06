module.exports = [
{ name: 'build',
  alias: 'b',
  type: String,
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
  name: 'timeout',
  alias: 't',
  type: Number
},{
  name: 'create',
  type: String,
}];