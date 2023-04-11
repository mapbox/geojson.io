import resolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import replace from '@rollup/plugin-replace';
import markdown from '@jackfranklin/rollup-plugin-markdown';
import css from 'rollup-plugin-import-css';
import copy from 'rollup-plugin-copy';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    sourcemap: true,
    strict: false
  },
  plugins: [
    commonjs({
      include: ['./src/**/*', './node_modules/**/*'],
      transformMixedEsModules: true
    }),

    replace({
      'require.main === module': 'false' // jsonhint export quirk
    }),

    resolve({
      browser: true,
      preferBuiltins: true
    }),

    json(),

    nodePolyfills(),

    markdown(),

    css({
      output: './dist/css/bundle.css',
      minify: production
    }),

    copy({
      targets: [
        {
          src: 'node_modules/@fortawesome/fontawesome-free/webfonts',
          dest: './dist'
        }
      ]
    })
  ]
};
