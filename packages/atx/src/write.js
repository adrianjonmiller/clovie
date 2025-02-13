const path = require('path');
const fs = require('fs');

module.exports = function write (pages, outputDir, keys = Object.keys(pages), accumulator = {}) {
  const key = keys.shift();
  const value = pages[key];

  if (accumulator[key] != value) {
    const dest = path.join(outputDir, key);
    const dir = path.dirname(dest);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  
    fs.writeFileSync(dest, value, err => {
      if (err) {
        console.log(err)
      }
    });
  }

  return keys.length ? write(pages, outputDir, keys) : 'success';
}