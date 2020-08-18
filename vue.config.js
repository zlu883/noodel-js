module.exports = {
    lintOnSave: false,
    configureWebpack: {
        output: {
            library: 'Noodel',
            libraryExport: 'default',
        }
    },
    devServer: {
        contentBase: './'
    },
    productionSourceMap: false,
    pages: {
        index: {
            entry: 'tests/index.ts',
            template: 'tests/index.html'
        },
        manual: {
            entry: 'tests/manual.ts',
            template: 'tests/manual.html'
        },
        unit: {
            entry: 'tests/unit.ts',
            template: 'tests/unit.html'
        },
    }
}