import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development the React app runs on http://localhost:5173.
// The proxy forwards /api and /media to the Django server, so the browser
// thinks everything comes from one place (no CORS setup needed).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media": "http://127.0.0.1:8000",
    },
  },
});
