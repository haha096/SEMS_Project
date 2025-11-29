import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // ✅ 추가: 브라우저에서 global 참조가 생길 때 window로 매핑
  define: {
    global: "window",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // Spring
        changeOrigin: true,
        // ❌ 이 줄을 없애야 /api/*가 그대로 백엔드로 전달됨
        // rewrite: (p) => p.replace(/^\/api/, ""),
      },
      "/table": {
        target: "http://localhost:5000", // Flask
        changeOrigin: true,
        // Flask는 /table 엔드포인트 그대로 사용
      },
    },
  },
});
