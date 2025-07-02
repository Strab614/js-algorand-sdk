/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        algorand: {
          primary: '#000000',
          secondary: '#FFFFFF',
          accent: '#00BF63',
        },
      },
    },
  },
  plugins: [],
}