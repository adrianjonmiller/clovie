module.exports = function render (views, compiler, keys = Object.keys(views), accumulator = {}) {
  const key = keys.shift();
  const value = views[key];
  const fileName = key.substr(0, key.lastIndexOf(".")) + ".html";
  accumulator[fileName] = compiler(value.template, value.data);
  return keys.length ? render(views, compiler, keys, accumulator) : accumulator;
}