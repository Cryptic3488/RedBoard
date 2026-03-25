/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Denison University athletics red
        brand: {
          DEFAULT: '#E51636',
          dark: '#B50F28',
          light: '#FF3354',
        },
        // Denison near-black (official — warm undertone)
        'near-black': '#100F0D',
        // Off-white cream
        cream: '#F8F4F0',
        // Tassel gold accent
        gold: '#FFC72C',
      },
      fontFamily: {
        display: ['Crimson Pro', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
