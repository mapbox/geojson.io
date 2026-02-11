/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        'mb-gray-dark': '#0e2127',
        'mb-purple': {
          500: '#4264fb',
          700: '#0f38bf'
        },
        'pink': '#d842fb',
        'pink-dark': '#c23ee1'
      },
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
};
