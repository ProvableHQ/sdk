const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");

const appConfig = {
    mode: 'production',
    entry: {
        index: './src/index.js'
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: '[name].bundle.js'
    },
    devServer: {
        port: 3000,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /nodeModules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "public", to: "public" }
            ]
        }),
        new HtmlWebpackPlugin(
        {
            template: './public/index.html'
        }),
    ],

    performance: {
        maxEntrypointSize: 16777216,
        maxAssetSize: 16777216
    },
    experiments: {
        asyncWebAssembly: true,
        topLevelAwait: true
    },
    devtool: 'source-map',
}

const workerConfig = {
    mode: 'production',
    entry: "./src/workers/worker.js",
    target: "webworker",
    resolve: {
        extensions: [".js", ".wasm"]
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: "worker.js"
    },
    experiments: {
        asyncWebAssembly: true,
        topLevelAwait: true
    },
    devtool: 'source-map',
};

module.exports = [appConfig, workerConfig];