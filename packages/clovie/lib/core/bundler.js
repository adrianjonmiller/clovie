import path from 'path';
import esbuild from 'esbuild';

export default function(file) {
  const pathObj = path.parse(file);
  
  return new Promise(async (resolve, reject) => {
    try {
      const result = await esbuild.build({
        entryPoints: [file],
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'app',
        platform: 'browser',
        target: ['es2015'],
        minify: false,
        sourcemap: false,
        // Performance optimizations
        treeShaking: true,
        metafile: false,
        logLevel: 'silent'
      });

      const { text } = result.outputFiles[0];
      resolve({[`${pathObj.name}.js`]: text});
    } catch (err) {
      reject(err);
    }
  });
};