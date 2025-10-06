import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    // Bundle optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React ecosystem
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI libraries
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "framer-motion", "@use-gesture/react", "@react-spring/web"],
          // Data fetching
          "query-vendor": ["@tanstack/react-query"],
          // Utilities
          "utils-vendor": ["date-fns", "sonner"],
          // DnD kit
          "dnd-vendor": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
        }
      }
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source map for production debugging (set to false for smaller builds)
    sourcemap: false
  }
});
