function getTemplates (files, src, accumulator = {}) {
  let file = files.shift();
  let key = file.substring(path.join(src).length);
  accumulator[key] = fs.readFileSync(file).toString('utf8');
  return files.length ? getTemplates(files, src, accumulator) : accumulator;
}