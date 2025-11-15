/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding'
      },
      boxShadow: {
        '3xl': '0 20px 50px -10px rgba(0,0,0,0.5)',
      },
      fontFamily: { 'sans': ['Inter', 'sans-serif'] }
    },
  },
  plugins: [],
};
