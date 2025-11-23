/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#111827',
        slate: '#1f2937',
        primary: '#5CE0E6',
        accent: '#3C6FF7',
      },
      borderRadius: {
        'xl': '1rem',
      },
    },
  },
  plugins: [],
}
