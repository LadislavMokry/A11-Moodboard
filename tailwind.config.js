// ABOUTME: Tailwind CSS configuration for the Prestige Kitchen project
// ABOUTME: Defines content paths, dark mode behavior and plugins.

/** @type {import('tailwindcss').Config} */
import animatePlugin from "tailwindcss-animate";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 8s linear infinite',
      },
    }
  },
  plugins: [animatePlugin]
};
