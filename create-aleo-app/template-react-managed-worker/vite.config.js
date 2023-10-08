import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@aleohq/wasm", "@aleohq/sdk"],
  },
  server: {
    // Needed if you are linking local packages for development
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), "../../sdk"],
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
