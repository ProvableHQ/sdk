import { defineConfig } from "vite";
export default defineConfig({
    optimizeDeps: {
        exclude: ["@aleohq/wasm", "@aleohq/sdk"],
    },
    server: {
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
    },
});
