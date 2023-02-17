const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const appConfig = {
    mode: 'development',
    entry: {
        index: './src/index.js'
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: '[name].bundle.js'
    },
    devServer: {
        port: 3000,
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
    plugins: [new HtmlWebpackPlugin({ template: './public/index.html' })],
    performance: {
        maxEntrypointSize: 8388608,
        maxAssetSize: 8388608
    },
    experiments: {
        asyncWebAssembly: true
    },
    devtool: 'source-map',
}

const workerConfig = {
    mode: 'development',
    entry: "./src/workers/worker.js",
    target: "webworker",
    plugins: [
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, "../wasm")
        })
    ],
    resolve: {
        extensions: [".js", ".wasm"]
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: "worker.js"
    },
    experiments: {
        asyncWebAssembly: true
    },
    devtool: 'source-map',
};

module.exports = [appConfig, workerConfig];