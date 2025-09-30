import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import cleanup from 'rollup-plugin-cleanup';
import json from '@rollup/plugin-json';

export default [
  // ES Module bundle - main entry point
  {
    input: 'lib/createClovie.js',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
      compact: false,
    },
    external: [
      // Keep Node.js built-ins external
      'fs',
      'path',
      'crypto',
      'http',
      'url',
      'events',
      'stream',
      'util',
      'os',
      'child_process',
      // Keep large dependencies external
      'express',
      'socket.io',
      'chokidar',
      'handlebars',
      'sass',
      'esbuild',
      'command-line-args',
      'istextorbinary',
      'type-detect',
      '@babel/core',
      '@babel/preset-env',
      'babelify'
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
        exportConditions: ['node']
      }),
      commonjs(),
      json(),
      cleanup({
        comments: 'some',
        literals: false,
        sourcemap: true,
      }),
      // Light minification - preserve readability for debugging
      terser({
        mangle: false,
        compress: {
          drop_console: false,
          drop_debugger: false,
          passes: 1,
        },
        format: {
          comments: 'some',
          beautify: true,
        },
      }),
    ],
  },
  
  // CommonJS bundle for older Node.js compatibility
  {
    input: 'lib/createClovie.js',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      compact: false,
      exports: 'named',
    },
    external: [
      // Keep Node.js built-ins external
      'fs',
      'path',
      'crypto',
      'http',
      'url',
      'events',
      'stream',
      'util',
      'os',
      'child_process',
      // Keep large dependencies external
      'express',
      'socket.io',
      'chokidar',
      'handlebars',
      'sass',
      'esbuild',
      'command-line-args',
      'istextorbinary',
      'type-detect',
      '@babel/core',
      '@babel/preset-env',
      'babelify'
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
        exportConditions: ['node']
      }),
      commonjs(),
      json(),
      cleanup({
        comments: 'some',
        literals: false,
        sourcemap: true,
      }),
      // Light minification for Node.js
      terser({
        mangle: false,
        compress: {
          drop_console: false,
          drop_debugger: false,
          passes: 1,
        },
        format: {
          comments: 'some',
          beautify: true,
        },
      }),
    ],
  },
];
