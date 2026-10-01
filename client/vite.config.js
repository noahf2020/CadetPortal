/**
 * vite.config.js
 *
 * Settings for Vite, the tool that runs the React webpage during development.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Any request that starts with /api is forwarded to the Flask server.
    // This lets the webpage call fetch("/api/links") without CORS problems.
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
