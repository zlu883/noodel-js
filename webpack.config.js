const path = require('path');
const VueLoaderPlugin = require('vue-loader/dist/plugin').default;
const TerserJSPlugin = require('terser-webpack-plugin');

const PACKAGE = require('./package.json');
const webpack = require('webpack');
const banner = 'Noodel.js v' + PACKAGE.version + '\n' +
    '(c) 2019-' + new Date().getFullYear() + ' ' + PACKAGE.author.name + '\n' +
    PACKAGE.license + ' License' + '\n' + PACKAGE.homepage;

function prodConfig() {
    return {
        mode: 'production',
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
        entry: './tests/manual.ts',
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
            filename: 'manual-test.js',
            path: path.resolve(__dirname, 'dist')
        }, 
    }
}

function noVueUmdMinConfig() {
    let config = prodConfig();

    config.externals = {
        'vue': {
            commonjs: 'vue',
            commonjs2: 'vue',
            amd: 'vue',
            root: 'Vue'
        }
    };
    config.output.filename = 'noodel-no-vue.umd.min.js';
    config.optimization = {
        minimize: true,
        minimizer: [new TerserJSPlugin({
            extractComments: false
        })]
    };

    return config;
}

function noVueUmdConfig() {
    let config = prodConfig();

    config.externals = {
        'vue': {
            commonjs: 'vue',
            commonjs2: 'vue',
            amd: 'vue',
            root: 'Vue'
        }
    };
    config.output.filename = 'noodel-no-vue.umd.js';
    config.optimization = {
        minimize: false,
    };

    return config;
}

function umdMinConfig() {
    let config = prodConfig();

    config.output.filename = 'noodel.umd.min.js';
    config.optimization = {
        minimize: true,
        minimizer: [new TerserJSPlugin({
            extractComments: false
        })]
    };

    return config;
}

function umdConfig() {
    let config = prodConfig();

    config.output.filename = 'noodel.umd.js';
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
        noVueUmdMinConfig(),
        noVueUmdConfig(),
        umdMinConfig(),
        umdConfig(),
    ];
}
