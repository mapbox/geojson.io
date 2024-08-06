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
        }
      },
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
};
