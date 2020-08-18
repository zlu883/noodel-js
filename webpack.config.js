const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const PACKAGE = require('./package.json');
const webpack = require('webpack');
const banner = 'Noodel.js - v' + PACKAGE.version + '\n' +
    '(c) 2019-' + new Date().getFullYear() + ' ' + PACKAGE.author.name + '\n' +
    PACKAGE.license + ' License' + '\n' + PACKAGE.homepage;

module.exports = env => {

    if (!env) env = {};

    let outputFileName = 'noodel';
    if (env.full) outputFileName += '-full';
    outputFileName += env.umd ? '.umd' : '.common';
    if (env.min) outputFileName += '.min';
    outputFileName += '.js';

    return {
        mode: 'production',
        entry: './src/main/Noodel.ts',
        resolve: {
            extensions: ['.ts', '.js', '.vue', '.json'],
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        externals: env.full ? undefined : {
            'vue': env.umd ? {
                commonjs: 'vue',
                commonjs2: 'vue',
                amd: 'vue',
                root: 'Vue'
            } 
            : "commonjs2 vue"
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.css$/,
                    use: env.css ? [
                        process.env.NODE_ENV !== 'production'
                            ? 'vue-style-loader'
                            : MiniCssExtractPlugin.loader,
                        'css-loader'
                    ] : [
                        'null-loader'
                    ]
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: {
                        appendTsSuffixTo: [/\.vue$/],
                    }
                },
            ],
        },
        plugins: [
            new VueLoaderPlugin(),
            new MiniCssExtractPlugin({
                filename: env.min ? 'noodel.min.css' : 'noodel.css'
            }),
            new webpack.BannerPlugin(banner)
        ],
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: outputFileName,
            library: 'Noodel',
            libraryExport: 'default',
            libraryTarget: env.umd ? 'umd' : 'commonjs'
        },
        optimization: {
            minimize: !!env.min,
            minimizer: [new TerserJSPlugin({
                extractComments: false
            }), new OptimizeCSSAssetsPlugin({})]
        },
    }
}