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

function prodConfig() {
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
                        configFile: 'tsconfig.prod.json',
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
        stats: 'minimal'
    }
}

function testUnitConfig() {
    return {
        mode: 'development',
        devServer: {
            contentBase: './',
            stats: 'minimal'
        },
        devtool: 'eval-source-map',
        entry: './tests/unit.ts',
        resolve: {
            extensions: ['.ts', '.js', '.vue', '.json'],
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
                        'style-loader',
                        'css-loader'
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
        ],
        output: {
            filename: 'unit-tests.js',
            path: path.resolve(__dirname, 'dist'),
        }, 
    }
}

function testManualConfig() {
    return {
        mode: 'development',
        devServer: {
            contentBase: './',
            stats: 'minimal'
        },
        devtool: 'eval-source-map',
        entry: './src/main/Noodel.ts',
        resolve: {
            extensions: ['.ts', '.js', '.vue', '.json'],
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
                        'style-loader',
                        'css-loader'
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
        ],
        output: {
            filename: 'noodel.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'Noodel',
            libraryExport: 'default',
            libraryTarget: 'umd'
        }, 
    }
}

function baseUmdMinConfig() {
    let config = prodConfig();

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
    let config = prodConfig();

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
    let config = prodConfig();

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
    let config = prodConfig();

    delete config.externals;
    config.output.filename = 'noodel-full.umd.min.js';

    return config;
}

function fullUmdConfig() {
    let config = prodConfig();

    delete config.externals;
    config.output.filename = 'noodel-full.umd.js';
    config.optimization = {
        minimize: false,
    };
 
    return config;
}

module.exports = env => {
    return env.test ? [
        testUnitConfig(),
        testManualConfig()
    ] : [
        baseUmdMinConfig(),
        baseUmdConfig(),
        baseCommonJsConfig(),
        fullUmdMinConfig(),
        fullUmdConfig(),
    ];
}
