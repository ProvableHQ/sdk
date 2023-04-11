const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production',
    output: {
        path: path.join(__dirname, '/dist'),
        filename: 'index.bundle.js'
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
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "public", to: "public" }
            ]
        }),
        new HtmlWebpackPlugin(
        {
            template: './public/index.html'
        })],
    performance: {
        maxEntrypointSize: 8388608,
        maxAssetSize: 8388608
    },
    experiments: {
        asyncWebAssembly: true
    },
    devtool: false,
}