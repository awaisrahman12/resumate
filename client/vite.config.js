import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api requests to the Express backend during development.
// Override the backend port with VITE_API_PORT if 5001 is taken on your machine
// (it must match PORT in server/.env).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.VITE_API_PORT || 5001}`,
        changeOrigin: true,
      },
    },
  },
});
