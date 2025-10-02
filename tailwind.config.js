// ABOUTME: Tailwind CSS configuration for the Prestige Kitchen project
// ABOUTME: Defines content paths, dark mode behavior and plugins.

/** @type {import('tailwindcss').Config} */
import animatePlugin from "tailwindcss-animate";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {}
  },
  plugins: [animatePlugin]
};
