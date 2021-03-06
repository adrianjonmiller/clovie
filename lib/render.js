module.exports = function render (views, compiler, fileNames = Object.keys(views), accumulator = {}, i = 0) {
  const fileName = fileNames[i];
  const view = views[fileName];
  accumulator[fileName] = compiler(view.template, {...view.data, fileName, fileNames});
  i++;
  return i < fileNames.length  ? render(views, compiler, fileNames, accumulator, i) : accumulator;
}