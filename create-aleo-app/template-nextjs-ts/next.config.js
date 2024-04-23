const TerserPlugin = require("terser-webpack-plugin");

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
    webpack: (config, { isServer }) => {

        config.module.rules.push({
            test: /\.aleo$/,
            use: 'raw-loader',
        });

        if (!isServer) {
            config.resolve.fallback = {
              fs: false,
              net: false,
              tls: false,
            };
          }


        config.experiments = { ...config.experiments, topLevelAwait: true };
        config.optimization = {
            ...config.optimization,
            minimize: true,
            runtimeChunk: 'single',
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        module: true,
                    }
                }),
            ]
        };

        return config;
    },
}

module.exports = nextConfig;
