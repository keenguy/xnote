const webpack = require('webpack')

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
    // module:{
    //     rules:[
    //
    //         {
    //             test: /\.(js|jsx)$/,
    //             use: ["babel-loader"]
    //
    //         },
    //     ]
    // },
    mode: 'development',
    devServer: {
        contentBase: path.join(ROOT_PATH, 'src'),
        port: 3000,
        hot: true
    },
    node: {
        __dirname: false,
        __filename: false
    },
    plugins:[
        new webpack.HotModuleReplacementPlugin()
    ]
};

const editorRendererConfig = merge(baseConfig,{
    target: 'electron-renderer',
    entry: {editor: './src/renderer/editor.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    mode:'development',
    plugins: [
        new HtmlWebPackPlugin({
            template: "src/pages/editor.html",
            filename: "./pages/editor.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
});

const viewerRendererConfig = merge(baseConfig,{
    target: 'electron-renderer',
    entry: {viewer: './src/renderer/viewer.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    mode:'development',
    plugins: [
        new HtmlWebPackPlugin({
            template: "src/pages/viewer.html",
            filename: "pages/viewer.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
});

const homeRendererConfig = merge(baseConfig,{
    target: 'electron-renderer',
    entry: {home: './src/renderer/home.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    mode:'development',
    plugins: [
        new HtmlWebPackPlugin({
            template: "src/pages/home.html",
            filename: "pages/home.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
});

module.exports = [electronConfig, editorRendererConfig, viewerRendererConfig, homeRendererConfig];