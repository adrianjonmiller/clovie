import * as sass from 'sass';
import path from 'path';

export default function (file) {
  let pathObj = path.parse(file);

  try {
    let res = sass.compile(file);
    return {[`${pathObj.name}.css`]: res.css};
  } catch (err) {
    console.log('Sass Error in file: ' + err.file);
    console.log('On line: ' + err.line);
    console.log(err.formatted);
    return {}
  }
}