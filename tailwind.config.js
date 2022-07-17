const path = require('path');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.resolve(__dirname, './node_modules/@syamsoul/vue3-datatable/**/*.vue'),
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
