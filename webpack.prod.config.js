const path = require('path')
const ROOT_PATH = path.resolve(__dirname)
const BUILD_PATH = path.resolve(ROOT_PATH, 'build')

const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base.js')
const CopyPlugin = require('copy-webpack-plugin');

const electronConfig = {
    target: 'electron-main',
    entry: {electron: './src/main/electron.js'},
    output: {
        path: BUILD_PATH,
        filename: 'main/[name].js'
    },
    mode: 'production',
    node: {
        __dirname: false,
        __filename: false
    }
};

const editorRendererConfig = merge(baseConfig, {
    target: 'electron-renderer',
    entry: {index: './src/renderer/editor.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    mode: 'production',
    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/pages/editor.html",
            filename: "./pages/editor.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: 'assets/[name].css',
            chunkFilename: '[id].css',
        })
    ]
});

const viewerRendererConfig = merge(baseConfig, {
    target: 'electron-renderer',
    entry: {viewer: './src/renderer/viewer.js'},
    output: {
        path: BUILD_PATH,
        filename: 'renderer/[name].js'
    },
    mode: 'production',
    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/pages/viewer.html",
            filename: "pages/viewer.html"
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: 'assets/[name].css',
            chunkFilename: '[id].css',
        }),
        new CopyPlugin([
            {from: 'src/pages/preview.html', to: path.join(BUILD_PATH, 'pages/preview.html')},
        ])
    ]
});

// const previewRendererConfig = merge(baseConfig,{
//     target: 'electron-renderer',
//     entry: {preview: './src/renderer/preview.js'},
//     output: {
//         path: BUILD_PATH,
//         filename: 'renderer/[name].js'
//     },
//     mode: 'production',
//     plugins: [
//         new HtmlWebPackPlugin({
//             template: "./src/pages/preview.html",
//             filename: "pages/preview.html"
//         }),
//         new MiniCssExtractPlugin({
//             // Options similar to the same options in webpackOptions.output
//             // both options are optional
//             filename: 'assets/[name].css',
//             chunkFilename: '[id].css',
//         })
//     ]
// })
// const copyConfig = {
//     mode: 'production',
//     plugins: [
//         new CopyPlugin([
//             {from: 'src/pages/preview.html', to: path.join(BUILD_PATH, 'pages/preview.html')},
//         ])
//     ]
// }

module.exports = [electronConfig, editorRendererConfig, viewerRendererConfig];