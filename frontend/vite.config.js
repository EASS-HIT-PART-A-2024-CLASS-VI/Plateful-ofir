import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://backend:8000", // ✅ מנתב את `/api/` ל-Backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), // ✅ מסיר את `/api/` מהנתיב
      },
    },
  },
});
