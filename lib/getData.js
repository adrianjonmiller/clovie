module.exports = function getData (data) {
  return new Promise ((resolve, reject) => {
    switch (typeof data) {
      case 'object':
        resolve(data);
      break;

      case 'function':
        data().then((res) => {
          resolve(res);
        });
      break;
    }
  })
}