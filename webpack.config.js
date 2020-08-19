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

function baseConfig() {
    return {
        mode: 'production',
        entry: './src/main/Noodel.ts',
        resolve: {
            extensions: ['.ts', '.js', '.vue', '.json'],
        },
        externals: {
            'vue': {
                commonjs: 'vue',
                commonjs2: 'vue',
                amd: 'vue',
                root: 'Vue'
            }
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.css$/,
                    use: [
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
            new webpack.BannerPlugin(banner)
        ],
        output: {
            path: path.resolve(__dirname, 'dist'),
            library: 'Noodel',
            libraryExport: 'default',
            libraryTarget: 'umd'
        }, 
    }
}

function baseUmdMinConfig() {
    let config = baseConfig();

    config.module.rules[1].use = [
        MiniCssExtractPlugin.loader,
        'css-loader'
    ];
    config.plugins.splice(1, 0, new MiniCssExtractPlugin({
        filename: 'noodel.min.css'
    }));
    config.output.filename = 'noodel.umd.min.js';
    config.optimization = {
        minimize: true,
        minimizer: [new TerserJSPlugin({
            extractComments: false
        }), new OptimizeCSSAssetsPlugin({})]
    };

    return config;
}

function baseUmdConfig() {
    let config = baseConfig();

    config.module.rules[1].use = [
        MiniCssExtractPlugin.loader,
        'css-loader'
    ];
    config.plugins.splice(1, 0, new MiniCssExtractPlugin({
        filename: 'noodel.css'
    }));
    config.output.filename = 'noodel.umd.js';
    config.optimization = {
        minimize: false,
    };

    return config;
}

function baseCommonJsConfig() {
    let config = baseConfig();

    config.externals = {
        'vue': 'commonjs2 vue'
    };
    config.output.filename = 'noodel.common.js';
    config.output.libraryTarget = 'commonjs'
    config.optimization = {
        minimize: false,
    };

    return config;
}

function fullUmdMinConfig() {
    let config = baseConfig();

    config.externals = undefined;
    config.output.filename = 'noodel-full.umd.min.js';

    return config;
}

function fullUmdConfig() {
    let config = baseConfig();

    config.externals = undefined;
    config.output.filename = 'noodel-full.umd.js';
    config.optimization = {
        minimize: false,
    };

    return config;
}

module.exports = [
    baseUmdMinConfig(),
    baseUmdConfig(),
    baseCommonJsConfig(),
    fullUmdMinConfig(),
    fullUmdConfig(),
];
