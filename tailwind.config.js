// ABOUTME: Tailwind CSS configuration for the Prestige Kitchen project
// ABOUTME: Defines content paths, dark mode behavior and plugins.

/** @type {import('tailwindcss').Config} */
import animatePlugin from "tailwindcss-animate";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#ff01eb",
        "primary-foreground": "#ffffff",
        pink: {
          50: "#ffe0fb",
          100: "#ffc2f6",
          200: "#ff99f0",
          300: "#ff70ea",
          400: "#ff47e4",
          500: "#ff01eb",
          600: "#ff01eb",
          700: "#d000c5",
          800: "#9f0093",
          900: "#6e0063"
        }
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        marquee: 'marquee 8s linear infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
      },
    }
  },
  plugins: [animatePlugin]
};
