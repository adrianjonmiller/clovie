module.exports = function render (views, compiler, keys = Object.keys(views), accumulator = {}) {
  let key = keys.shift();
  let value = views[key];
  accumulator[key] = compiler(value.template, value.data);
  return keys.length ? render(views, compiler, keys, accumulator) : accumulator;
}