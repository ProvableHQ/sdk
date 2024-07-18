const TerserPlugin = require("terser-webpack-plugin")
/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ]
    },
    webpack: (config) => {
        config.experiments = { ...config.experiments, topLevelAwait: true };
        config.optimization = { ...config.optimization, minimize: true, minimizer: [new TerserPlugin({
                terserOptions: {
                    module: true,
                }
            })], }
        return config;
    },
}

module.exports = nextConfig
