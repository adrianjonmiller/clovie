import type from 'type-detect';

export default function getData (data) {
  return new Promise ((resolve, reject) => {
    switch (type(data)) {
      case 'Object':
        resolve(data);
      break;

      case 'function':
        resolve(data())
      break;

      case 'Promise':
        data.then(resolve)
      break;
    }
  })
}