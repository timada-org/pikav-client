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
      "/pikav-eu-west-1a": {
        target: "http://127.0.0.1:4455",
        changeOrigin: true,
      },
      "/pikav-eu-west-1b": {
        target: "http://127.0.0.1:4455",
        changeOrigin: true,
      },
      "/pikav-eu-west-1c": {
        target: "http://127.0.0.1:4455",
        changeOrigin: true,
      },
      "/pikav-us-west-1a": {
        target: "http://127.0.0.1:4455",
        changeOrigin: true,
      },
      "/api-eu-west-1a": {
        target: "http://127.0.0.1:4455/todo-eu-west-1a",
        changeOrigin: true,
        rewrite: (path) => path.substring(15),
      },
      "/api-eu-west-1b": {
        target: "http://127.0.0.1:4455/todo-eu-west-1b",
        changeOrigin: true,
        rewrite: (path) => path.substring(15),
      },
      "/api-eu-west-1c": {
        target: "http://127.0.0.1:4455/todo-eu-west-1c",
        changeOrigin: true,
        rewrite: (path) => path.substring(15),
      },
      "/api-us-west-1a": {
        target: "http://127.0.0.1:4455/todo-us-west-1a",
        changeOrigin: true,
        rewrite: (path) => path.substring(15),
      },
      "/kratos": {
        target: "http://127.0.0.1:4433",
        rewrite: (path) => path.substring(7),
        changeOrigin: true,
      },
    },
  },
});
