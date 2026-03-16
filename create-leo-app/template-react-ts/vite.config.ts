import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  assetsInclude: ["**/*.wasm"],
  plugins: [react()],

  build: {
    target: "esnext",
  },

  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
    exclude: [
      "@provablehq/wasm",
      "@provablehq/wasm-account-tools",
    ],
  },

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});