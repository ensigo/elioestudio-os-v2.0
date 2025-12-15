/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elio: {
          white: '#FFFFFF',
          smoke: '#F3F4F6', // Gray-50/100 equivalent
          black: '#111827', // Gray-900 equivalent
          steel: '#4B5563', // Gray-600 equivalent
          yellow: '#EAB308', // Brand Accent
          'yellow-hover': '#CA8A04',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}