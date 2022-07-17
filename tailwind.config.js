const path = require('path');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/lib-components/**/*.vue',
    './node_modules/litepie-datepicker-tw3/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'litepie-primary': colors.sky, // color system for light mode
        'litepie-secondary': colors.gray, // color system for dark mode
      },
    },
  },
  plugins: [],
}
