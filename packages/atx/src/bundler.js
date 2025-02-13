const path = require('path');
const esbuild = require('esbuild');

module.exports = function(file) {
  const pathObj = path.parse(file);
  
  return new Promise(async (resolve, reject) => {
    try {
      const result = await esbuild.build({
        entryPoints: [file],
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'app',
        platform: 'browser',
        target: ['es2015'],
        minify: false,
        sourcemap: false
      });

      const { text } = result.outputFiles[0];
      resolve({[`${pathObj.name}.js`]: text});
    } catch (err) {
      reject(err);
    }
  });
};