// ABOUTME: PostCSS configuration enabling Tailwind CSS and Autoprefixer
// ABOUTME: Required for Tailwind build within Vite.

import tailwindcssPlugin from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwindcssPlugin(), autoprefixer()]
};
