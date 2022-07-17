const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'sd-',
  content: [
    './src/lib-components/*.vue',
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
