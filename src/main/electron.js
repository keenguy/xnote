const {app, BrowserWindow, viewView, ipcMain, Menu} = require('electron')

// const md = require('./lib/markdown.js');
const getMenu = require('./menu.js')
// const url = require('url')
const path = require('path')
// const fs = require('fs')
const isDev = require("electron-is-dev");


// const Store = require('electron-store');
// const main = require('file-loader?name=[name].[ext]!../public/main.html');


let editorWindow = null
let viewerWindow = null
let vm = require('./ViewManager.js')
// let toLoad = null

const editorPage = "pages/editor.html"
const viewPage = "pages/viewer.html"

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

function createEditorWindow(cb) {
    editorWindow = new BrowserWindow(winOpts)
    if (isDev) {
        console.log("dev, loadFile")
        editorWindow.loadURL("http://localhost:3000/" + editorPage)
    } else {
        console.log("not dev, loadFile")
        editorWindow.loadFile(path.join(__dirname,"../",editorPage))
    }
    editorWindow.on('closed', function () {
        editorWindow = null
    })
    if (cb) {
        cb()
    }
}

function createviewerWindow(cb) {
    const opts = Object.assign({titleBarStyle: 'hiddenInset'}, winOpts)
    viewerWindow = new BrowserWindow(opts)
    vm.setWindow(viewerWindow)
    if (isDev) {
        viewerWindow.loadURL("http://localhost:3000/" + viewPage)
    } else {
        viewerWindow.loadFile(path.join(__dirname, "../", viewPage))
    }

    viewerWindow.on('closed', function () {
        viewerWindow = null
        vm.clearWindow()
    })
    if (cb) {
        cb()
    }
}

function openEditorWindow() {
    if (!editorWindow) {
        createEditorWindow()
    } else {
        editorWindow.show()
    }
}

function openviewerWindow(cb) {
    if (!viewerWindow) {
        createviewerWindow(() => {
            if(cb) {
                viewerWindow.webContents.on('did-finish-load', cb)
            }
        })
    } else {
        viewerWindow.show()
        if(cb) {
            cb()
        }
    }
}

app.on('ready', () => {
    appIsReady = true
    createEditorWindow()

    function menuAction(cmd, opt) {
        if (cmd === 'toview' && viewerWindow) {
            viewerWindow.show();
        } else if (cmd === 'toEditor' && editorWindow) {
            editorWindow.show();
        } else if (cmd === 'closeTab') {
            if (viewerWindow && viewerWindow.isFocused()) {
                // console.log("close Tab in preview window")
                viewerWindow.webContents.send('closeTab')
            }
        }
        // else if (cmd === 'callEdit' && editorWindow) {
        //     editorWindow.webContents.send(opt.msg, opt.data);
        // } else if (cmd === 'callPreview' && viewerWindow) {
        //     viewerWindow.webContents.send(opt.msg, opt.data);
        // } else if (cmd === 'findInPreview' && viewerWindow && viewerWindow.isFocused){
        //     viewerWindow.webContents.send('find')
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
    if (!editorWindow && appIsReady) {
        createEditorWindow()
    }
})

// editorWindow.webContents events
ipcMain.on('preview', (event, data) => {
    console.log("preview: ", data.title, "at ", data.url)
    data.url = path.join("file://", __dirname, "../../test", data.url)

    openviewerWindow(()=>{
        vm.loadURLInNewView(data)
    })


})

// viewerWindow.webContents events
ipcMain.on("newTab", (event, id)=>{
    vm.loadToLoad(id)
})

ipcMain.on('closeWindow', (event)=>{
    const win = viewerWindow.fromWebContents(event.sender)
    win.close()
})

ipcMain.on("goBackOrForward", (event, data) => {
    if (viewerWindow) {
        if (data.back) {
            vm.getView(data.viewId).webContents.goBack();
        } else {
            vm.getView(data.viewId).webContents.goForward();
        }
    }
})


// dom events
ipcMain.on('domWindowResize',(event, data)=>{
    bounds = {x:0, y:90, width: data.width, height: data.height-90}
    vm.setBounds(bounds)
    if(viewerWindow.getviewView()) {
        viewerWindow.getviewView().setBounds(bounds)
    }
})

