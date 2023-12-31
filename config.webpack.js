const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new webpack.BannerPlugin(fs.readFileSync('./LICENSE', 'utf8'))
    ],
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'client'),
    },
};