/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Denison University red
        brand: {
          DEFAULT: '#C8102E',
          dark: '#9B0020',
          light: '#E8324A',
        },
      },
    },
  },
  plugins: [],
}
