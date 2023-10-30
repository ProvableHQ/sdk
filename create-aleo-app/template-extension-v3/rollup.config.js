import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
    input: {
        service_worker: "./src/service_worker.js",
    },
    output: {
        dir: "static/js",
        format: "es",
        sourcemap: true,
    },
    plugins: [
        nodeResolve()
    ],
};
