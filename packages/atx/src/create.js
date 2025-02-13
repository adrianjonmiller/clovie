const copydir = require('copy-dir');
const path = require('path');
const fs = require("fs")

const boilerplate = path.resolve(__dirname, '../boilerplate');

module.exports = (dest) => new Promise((res, rej) => {
  try {
    if (fs.existsSync(dest)) {
      throw `Directory '${dest}'exists`
    } else {
      dest = path.resolve(dest)
      copydir.sync(boilerplate, dest, {
        filter: function(stat, _, filename){
          if (stat === 'directory' && filename === 'dist') {
            return false;
          }
          return true;  // remind to return a true value when file check passed.
        }
      });
      res(`New Attics project created at ${dest}`)
    }
  } catch(e) {
    rej(e)
  }
});