import { nodeResolve } from "@rollup/plugin-node-resolve";
import { importMetaAssets } from "@web/rollup-plugin-import-meta-assets";

export default {
    input: {
        service_worker: "./src/service_worker.js",
        offscreen: "./src/offscreen.js",
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
            exclude: "./src/offscreen.js",
        }),
    ],
};
