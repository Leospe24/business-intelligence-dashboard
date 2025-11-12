/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'primary-brand': '#4F46E5',
        'primary-hover': '#4338CA',
        'background-light': '#F9FAFB',
      }
    },
  },
  plugins: [],
}