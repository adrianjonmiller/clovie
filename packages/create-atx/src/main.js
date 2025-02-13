const copydir = require('copy-dir');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

function create(dest, template = 'default') {
  return new Promise((resolve, reject) => {
    try {
      // Check if destination exists
      if (fs.existsSync(dest)) {
        throw new Error(`Directory '${dest}' already exists`);
      }

      // Resolve template path
      const templatePath = path.join(TEMPLATES_DIR, template);
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template '${template}' not found`);
      }

      // Resolve destination path
      const destPath = path.resolve(dest);

      // Copy template to destination
      copydir.sync(templatePath, destPath, {
        filter: (stat, filepath, filename) => {
          // Skip dist directory and node_modules
          if (stat === 'directory' && (filename === 'dist' || filename === 'node_modules')) {
            return false;
          }
          return true;
        }
      });

      resolve(`New ATX project created at ${destPath}`);
    } catch (error) {
      reject(error instanceof Error ? error.message : String(error));
    }
  });
}

module.exports = create; 