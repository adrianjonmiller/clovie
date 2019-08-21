const path = require("path");
const browserify = require("browserify");

module.exports = function(file) {
  let filePath = path.resolve(file);
  let pathObj = path.parse(file);

  return new Promise((res, rej) => {
    let code = browserify(filePath, {debug: true})
    .transform('babelify', {presets: ["@babel/preset-env"]})
    .bundle((err, buff) => {
      if (err) {
        rej(err)
      }
      res({[`${pathObj.name}.js`]: buff})
    })
  })
};