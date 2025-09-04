import type from 'type-detect';

const render = async (views, compiler, fileNames = Object.keys(views), accumulator = {}) => {
  if (!fileNames || fileNames.length === 0) return accumulator;
  
  for (const fileName of fileNames) {
    const view = views[fileName];
    if (!view || !view.template) continue;
    
    const res = compiler(view.template, {...view.data, fileName, fileNames});
    accumulator[fileName] = type(res) === 'Promise' ? await res : res;
  }
  
  return accumulator;
}

export default render;