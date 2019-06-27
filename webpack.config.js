const path = require('path')
const ROOT_PATH = path.resolve(__dirname)
const BUILD_PATH = path.resolve(ROOT_PATH, 'public')    // development

const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base.js')

const electronConfig = {
    target: 'electron-main',
    entry: {electron: './src/main/electron.js'},
    output: {
        path: BUILD_PATH,
        filename: 'main/[name].js'
    },
    mode: 'development',
    devServer: {
        contentBase: path.join(ROOT_PATH, 'src'),
        port: 3000
    },
    node: {
        __dirname: false,
        __filename: false
    }
};

const editorRendererConfig = merge.smart(baseConfig,{
    target: 'electron-renderer',
    entry: {editor: './src/renderer/editor.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [{
                    loader: 'html-loader'
                }]
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // you can specify a publicPath here
                            // by default it uses publicPath in webpackOptions.output
                            publicPath: '../',
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    },
                    'css-loader']
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"]

            },
            {test: /\.(jpe?g|png|gif|svg|eot|woff|ttf|svg|woff2)$/, loader: "file-loader?name=[name].[ext]"}
        ]
    },
    mode: 'development',
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/pages/editor.html",
            filename: "./pages/editor.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        })
    ]
});

const viewerRendererConfig = merge.smart(baseConfig,{
    target: 'electron-renderer',
    entry: {viewer: './src/renderer/viewer.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    module: {
        rules: [{
            test: /\.html$/,
            use: [{
                loader: 'html-loader'
            }]
        },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"]

            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // you can specify a publicPath here
                            // by default it uses publicPath in webpackOptions.output
                            publicPath: '../',
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    },
                    'css-loader']
            },
            {test: /\.(jpe?g|png|gif|svg|eot|woff|ttf|svg|woff2)$/, loader: "file-loader?name=[name].[ext]"}
        ]
    },
    mode: 'development',
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/pages/viewer.html",
            filename: "./pages/viewer.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        })
    ]
});

const previewRendererConfig = merge.smart(baseConfig,{
    target: 'electron-renderer',
    entry: {preview: './src/renderer/preview.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"]

            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // you can specify a publicPath here
                            // by default it uses publicPath in webpackOptions.output
                            publicPath: '../',
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    },
                    'css-loader']
            },
        ]
    },
    mode: 'development',
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/pages/preview.html",
            filename: "./pages/preview.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        })
    ]

})
module.exports = [electronConfig, editorRendererConfig, viewerRendererConfig, previewRendererConfig];