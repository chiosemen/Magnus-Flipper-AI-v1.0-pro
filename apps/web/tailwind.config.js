/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      perspective: {
        "1000": "1000px",
        "2000": "2000px",
      },
      transformStyle: {
        "3d": "preserve-3d",
      },
      backgroundImage: {
        "neon-rainbow": "linear-gradient(90deg, #9333ea, #3b82f6, #06b6d4, #3b82f6, #9333ea)",
      },
      dropShadow: {
        neon: "0 0 10px rgba(147, 51, 234, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)",
        "neon-lg": "0 0 20px rgba(147, 51, 234, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)",
      },
      brightness: {
        150: "1.5",
      },
    },
  },
  plugins: [],
};
