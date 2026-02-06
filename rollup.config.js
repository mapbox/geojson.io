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
      'require.main === module': 'false', // jsonhint export quirk
      // Replace hardcoded dev path with production path in ui/map/clickable_marker.js
      '../dist/icons': production ? '/icons' : '../dist/icons',
      delimiters: ['', ''] 
    }),

    resolve({
      browser: true,
      preferBuiltins: true
    }),

    json(),

    nodePolyfills(),

    markdown(),

    css({
      output: 'css/bundle.css',
      minify: production
    }),

    copy({
      targets: [
        {
          src: 'index.html',
          dest: './dist',
          transform: (contents) => {
            return contents.toString()
              .replace("href='dist/bundle.css'", "href='bundle.css'")
              .replace('src="dist/bundle.js"', 'src="bundle.js"');
          }
        },
        {
          src: 'img',
          dest: './dist'
        },
        {
          src: 'node_modules/@fortawesome/fontawesome-free/webfonts',
          dest: './dist'
        },
        {
          src: 'node_modules/@mapbox/maki/icons',
          dest: './dist'
        },
        {
          src: 'img/marker-chars/*.svg',
          dest: './dist/icons'
        }
      ]
    })
  ]
};
