import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "." },
        { src: "icons", dest: "." },
      ],
    }),
  ],
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
