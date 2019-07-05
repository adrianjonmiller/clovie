const babel = require("@babel/core");
const path = require('path');

module.exports = function (file) {
  let pathObj = path.parse(file);
  let res = babel.transformFileSync(file);
  return {[`${pathObj.name}.js`]:res.code}
}