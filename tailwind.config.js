/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // enables dark mode toggling with a CSS class
  theme: {
    extend: {
      colors: {
        dark: "#0d1117",          // Main background
        lightDark: "#161b22",     // Card/surface background
        borderGray: "#30363d",    // Border/subtle dividers
        textGray: "#c9d1d9",      // Soft text
        accentOrange: "#ff851b",  // Primary brand accent
        brand: {
          light: "#3b82f6",
          DEFAULT: "#2563eb",
          dark: "#1e40af",
        },
        gray: {
          900: "#121212",
          800: "#1f1f1f",
          700: "#374151",
          600: "#4b5563",
          500: "#6b7280",
          400: "#9ca3af",
          300: "#d1d5db",
          200: "#e5e7eb",
          100: "#f3f4f6",
          50: "#fafafa",
        },
      },
      boxShadow: {
        'orange-glow': '0 4px 14px 0 rgba(255, 133, 27, 0.39)',
        subtle: "0 2px 8px rgba(0, 0, 0, 0.15)",
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      spacing: {
        72: "18rem",
        84: "21rem",
        96: "24rem",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [ 
  require('@tailwindcss/forms'),
  require('@tailwindcss/typography'),
  require('@tailwindcss/line-clamp'),],
};
