import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";

import path from "path";

const appConfig = {
    mode: "production",
    entry: {
        index: "./src/index.jsx",
    },
    output: {
        path: path.resolve("dist"),
        filename: "[name].bundle.js",
    },
    resolve: {
        extensions: [".js", ".wasm", ".jsx"],
    },
    devServer: {
        port: 3000,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
        client: {
            overlay: false,
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /nodeModules/,
                use: {
                    loader: "babel-loader",
                },
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "public", to: "public" },
                { from: "_headers", to: "." },
                { from: "_redirects", to: "." }],
        }),
        new HtmlWebpackPlugin({
            template: "./index.html",
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
          terserOptions: {
            module: true,
          }
        })],
      },
    performance: {
        hints: false,
        maxAssetSize: 13 * 1024 * 1024, // 12 MiB
        maxEntrypointSize: 13 * 1024 * 1024, // 12 MiB
    },
    stats: {
        warnings: false,
    },
    experiments: {
        asyncWebAssembly: true,
        topLevelAwait: true,
    },
    devtool: "source-map",
};

export default [appConfig];
