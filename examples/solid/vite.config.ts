import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    target: "esnext",
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/oauth/token": {
        target: "http://127.0.0.1:6550",
        changeOrigin: true,
      },
      "/api-eu-west-1a": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.substring(15),
      },
      "/api-eu-west-1b": {
        target: "http://127.0.0.1:3002",
        changeOrigin: true,
        rewrite: (path) => path.substring(15),
      },
      "/api-us-west-1a": {
        target: "http://127.0.0.1:3003",
        changeOrigin: true,
        rewrite: (path) => path.substring(15),
      },
    },
  },
});
