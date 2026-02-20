import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(fileURLToPath(new URL("./src", import.meta.url))),
    },
  },
  base: "/",
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // your server.js port
        changeOrigin: true,
        secure: false,
      },
      "/pages": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/testimonials": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
