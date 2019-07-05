const sass = require('sass');
const path = require('path');

module.exports = function (file) {
  let pathObj = path.parse(file);

  try {
    let res = sass.renderSync({file});
    if (res.css) {
      return {[`${pathObj.name}.css`]: res.css.toString()};
    } else {
      throw res
    }
  } catch (err) {
    console.log('Sass Error in file: ' + err.file);
    console.log('On line: ' + err.line);
    console.log(err.formatted);
    return {}
  }
}