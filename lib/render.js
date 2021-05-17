const type = require('type-detect');

module.exports = render = async (views, compiler, fileNames = Object.keys(views), accumulator = {}, i = 0) => {
  const fileName = fileNames[i];
  const view = views[fileName];

  const res = compiler(view.template, {...view.data, fileName, fileNames});
  accumulator[fileName] = type(res) === 'Promise' || type(res) === 'Object'? await res : res;

  i++;
  return i < fileNames.length  ? render(views, compiler, fileNames, accumulator, i) : accumulator;
}