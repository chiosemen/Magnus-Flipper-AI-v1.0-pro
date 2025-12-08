/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./marketing-swoopa/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      perspective: {
        "1000": "1000px",
        "2000": "2000px",
      },
      transformStyle: {
        "3d": "preserve-3d",
      },
      backgroundImage: {
        "neon-rainbow": "linear-gradient(90deg, #9333ea, #3b82f6, #06b6d4, #3b82f6, #9333ea)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-card": "var(--gradient-card)",
        "gradient-glow": "var(--gradient-glow)",
        "gradient-accent": "var(--gradient-accent)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
        neon: "0 0 10px rgba(147, 51, 234, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)",
        "neon-lg": "0 0 20px rgba(147, 51, 234, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)",
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
