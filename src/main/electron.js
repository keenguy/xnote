const {app, BrowserWindow, BrowserView, ipcMain, Menu} = require('electron')

// const md = require('./lib/markdown.js');
const getMenu = require('./menu.js')
// const url = require('url')
const path = require('path')
// const fs = require('fs')
const isDev = require("electron-is-dev");


// const Store = require('electron-store');
// const main = require('file-loader?name=[name].[ext]!../public/main.html');


let editorWindow = null
let browserWindow = null


const editorPage = "pages/editor.html"
const browserPage = "pages/browser.html"

let appIsReady = false

const userDataPath = app.getPath('userData')

// common window options
const winOpts = {
    width: 1400,
    height: 880,
    show: true,
    movable: true,
    webPreferences: {
        nodeIntegration: true,
        additionalArguments: ['--user-data-path=' + userDataPath]
    }
}
function createEditorWindow(cb){
    editorWindow = new BrowserWindow(winOpts)
    if (isDev) {
        editorWindow.loadURL("http://localhost:3000/" + editorPage)
    } else {
        editorWindow.loadFile(editorPage)
    }
    editorWindow.on('closed',function(){
        editorWindow = null
    })
    if(cb){
        cb()
    }
}

function createBrowserWindow(cb){
    const opts = Object.assign({titleBarStyle: 'hiddenInset'}, winOpts)
    browserWindow = new BrowserWindow(opts)
    if (isDev) {
        browserWindow.loadURL("http://localhost:3000/" + browserPage)
    } else {
        browserWindow.loadFile(browserPage)
    }
    browserWindow.on('closed', function () {
        browserWindow = null
    })
}

function openEditorWindow(){
    if(!editorWindow){
        createEditorWindow()
    }else{
        editorWindow.show()
    }
}

function openBrowserWindow(){
    if(!browserWindow){
        createBrowserWindow()
    }else{
        browserWindow.show()
    }
}

app.on('ready', () => {
    appIsReady = true
    createEditorWindow()
    function menuAction(cmd, opt) {
        if (cmd === 'toBrowser' && browserWindow) {
            browserWindow.show();
        } else if (cmd === 'toEditor' && editorWindow) {
            editorWindow.show();
        } else if (cmd === 'closeTab'){
            if(browserWindow && browserWindow.isFocused()) {
                // console.log("close Tab in preview window")
                browserWindow.webContents.send('closeTab')
            }
        }
        // else if (cmd === 'callEdit' && editorWindow) {
        //     editorWindow.webContents.send(opt.msg, opt.data);
        // } else if (cmd === 'callPreview' && browserWindow) {
        //     browserWindow.webContents.send(opt.msg, opt.data);
        // } else if (cmd === 'findInPreview' && browserWindow && browserWindow.isFocused){
        //     browserWindow.webContents.send('find')
        // }
    }

    Menu.setApplicationMenu(getMenu(menuAction));
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if(!editorWindow && appIsReady){
        createEditorWindow()
    }
})







ipcMain.on('preview', (event, data) => {
    console.log("preview: ", data.path)
    openBrowserWindow();
    const p = path.join(__dirname, "../../test", data.path)
    const events = [{
        name: "newTab",
        data: {title: "preview"}
    }]
    const viewId = vm.createView()
    vm.loadFileInView(viewId,{filePath:p, cb: ()=>{
        browserWindow.webContents.send('newTab', {viewId: viewId})
        }})
    vm.setView(viewId)

})

ipcMain.on("setView", (event,data)=>{
    vm.setView(data.viewId)
})



ipcMain.on("goBackOrForward",(event, data)=>{
    if(browserWindow){
        if(data.back) {
            vm.getView(data.viewId).webContents.goBack();
        }else{
            vm.getView(data.viewId).webContents.goForward();
        }
    }
})


/* ViewManager */
let vm = (function (){
    let viewMap = {} // id: view
    let viewStateMap = {} // id: view state
    let id = 0;
    const bounds = {x:0, y: 87, height: 713, width:1400}

    function createView(){
        let view = new BrowserView()
        id++;
        view.setBounds(bounds)
        viewMap[id] = view
        viewStateMap[id] = {loadedInitialURL: false}
        return id
    }

    function loadFileInView(id, args){
        const p = viewMap[id].webContents.loadFile(args.filePath)
        if(args.cb){
            p.then(()=>{args.cb()})
        }
    }

    function destroyView (id) {
        if (viewMap[id] === viewWindow.getBrowserView()) {
            viewWindow.setBrowserView(null)
        }
        viewMap[id].destroy()
        delete viewMap[id]
        delete viewStateMap[id]
    }

    function destroyAllViews () {
        for (let id in viewMap) {
            destroyView(id)
        }
    }

    function setView (id) {
        browserWindow.setBrowserView(viewMap[id])
        viewMap[id].setBounds(bounds)
    }

    function focusView (id) {
        // empty views can't be focused because they won't propogate keyboard events correctly, see https://github.com/minbrowser/min/issues/616
        if (viewMap[id].webContents.getURL() !== '' || viewMap[id].webContents.isLoading()) {
            viewMap[id].webContents.focus()
        } else {
            browserWindow.webContents.focus()
        }
    }

    function hideCurrentView () {
        browserWindow.setBrowserView(null)
        browserWindow.webContents.focus()
    }

    function getView (id) {
        return viewMap[id]
    }

    return {
        createView,
        loadFileInView,
        getView,
        setView
    }
})();

global.getView = vm.getView