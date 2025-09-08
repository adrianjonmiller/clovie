import path from 'path';
import fs from 'fs';

export default function write (pages, outputDir, keys = Object.keys(pages), accumulator = {}) {
  const key = keys.shift();
  const value = pages[key];

  if (accumulator[key] != value) {
    const dest = path.join(outputDir, key);
    const dir = path.dirname(dest);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  
    // Check if the value is a Buffer (binary data) or string
    const options = Buffer.isBuffer(value) ? {} : { encoding: 'utf8' };
    
    fs.writeFileSync(dest, value, options, err => {
      if (err) {
        console.log(err)
      }
    });
  }

  return keys.length ? write(pages, outputDir, keys) : 'success';
}