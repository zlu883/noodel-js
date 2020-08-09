module.exports = {
    lintOnSave: false,
    configureWebpack: {
        output: {
            library: 'Noodel',
            libraryExport: 'default'
        }
    },
    devServer: {
        contentBase: './'
    },
    productionSourceMap: false
}