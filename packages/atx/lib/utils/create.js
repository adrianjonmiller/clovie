import copydir from 'copy-dir';
import path from 'path';
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const boilerplate = path.resolve(__dirname, '../boilerplate');

export default (dest) => new Promise((res, rej) => {
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