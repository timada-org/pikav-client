import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
  server: {
    proxy: {
      "/pikav": {
        target: "http://127.0.0.1:4455",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:4455/todo",
        changeOrigin: true,
        rewrite: (path) => path.substring(4),
      },
      "/sessions/whoami": {
        target: "http://127.0.0.1:4433",
        changeOrigin: true,
      },
    },
  },
});
