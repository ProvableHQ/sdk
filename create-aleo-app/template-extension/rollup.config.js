import { nodeResolve } from "@rollup/plugin-node-resolve";
import { importMetaAssets } from "@web/rollup-plugin-import-meta-assets";

export default {
    input: {
        background: "./src/background.js",
        worker: "./src/worker.js",
    },
    output: {
        dir: "static/js",
        format: "es",
        sourcemap: true,
    },
    plugins: [
        nodeResolve(),
        importMetaAssets({
            exclude: "./src/background.js",
        }),
    ],
};
