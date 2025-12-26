import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
    // Ensure assets are inlined for Chrome Extension compatibility
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
  },
  // Ensure the base path works correctly in extension context
  base: "./",
});
