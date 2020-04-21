module.exports = {
    lintOnSave: false,
    configureWebpack: {
        output: {
            library: 'Noodel',
            libraryExport: 'default'
        }
    },
    productionSourceMap: false
}