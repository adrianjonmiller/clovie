const copydir = require('copy-dir');
const path = require('path');

const boilerplate = path.resolve(__dirname, '../boilerplate')

module.exports = function (dest) {
  dest = path.resolve(dest)
  copydir.sync(boilerplate, dest, {
    filter: function(stat, _, filename){
      if (stat === 'directory' && filename === 'dist') {
        return false;
      }
      return true;  // remind to return a true value when file check passed.
    }
  });
}