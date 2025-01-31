import { defineConfig } from "vite";
export default defineConfig({
    optimizeDeps: {
        exclude: ["@provablehq/wasm", "@provablehq/sdk"],
    },
    server: {
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
    },
});
