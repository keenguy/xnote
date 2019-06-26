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
let vm = require('./ViewManager.js')

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

function createEditorWindow(cb) {
    editorWindow = new BrowserWindow(winOpts)
    if (isDev) {
        editorWindow.loadURL("http://localhost:3000/" + editorPage)
    } else {
        editorWindow.loadFile(editorPage)
    }
    editorWindow.on('closed', function () {
        editorWindow = null
    })
    if (cb) {
        cb()
    }
}

function createBrowserWindow(cb) {
    const opts = Object.assign({titleBarStyle: 'hiddenInset'}, winOpts)
    browserWindow = new BrowserWindow(opts)
    vm.setWindow(browserWindow)
    if (isDev) {
        browserWindow.loadURL("http://localhost:3000/" + browserPage)
    } else {
        browserWindow.loadFile(browserPage)
    }

    browserWindow.on('closed', function () {
        browserWindow = null
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

function openBrowserWindow(cb) {
    if (!browserWindow) {
        createBrowserWindow(() => {
            if(cb) {
                browserWindow.webContents.on('did-finish-load', cb)
            }
        })
    } else {
        browserWindow.show()
        if(cb) {
            cb()
        }
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
        } else if (cmd === 'closeTab') {
            if (browserWindow && browserWindow.isFocused()) {
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
    vm.init()
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


/* views events */
// const viewEvents = [
// {event:'new-window',
//     options:{preventDefault: true},
//     id: 0
// },
//
// view.webContents.on('will-navigate', (event,url)=>{
//     event.preventDefault()
//     console.log("will-navigate: ", url)
// })
//     ]
ipcMain.on('preview', (event, data) => {
    console.log("preview: ", data.title, "at ", data.url)
    data.url = path.join("file://", __dirname, "../../test", data.url)

    openBrowserWindow()

    vm.loadURLInNewView(data)
})

// ipcMain.on('loadURL', (event,data)=>{
//     const viewId = vm.createView()
//     console.log("loadURL")
//     if(!data.url.startsWith("http://")){
//         const p = path.join(__dirname, "../../test", data.url)
//         data.url = `file://${p}`
//     }
//
//     console.log("loadURL: ", data.url)
//     vm.loadURLInView(viewId, {url:data.url}).then(()=>{
//         const tabId = null;
//         browserWindow.webContents.send('assignViewToTab', {tabId: tabId,viewId: viewId})
//     })
// })


ipcMain.on("goBackOrForward", (event, data) => {
    if (browserWindow) {
        if (data.back) {
            vm.getView(data.viewId).webContents.goBack();
        } else {
            vm.getView(data.viewId).webContents.goForward();
        }
    }
})


//resize browserviews if browserwindow resize
ipcMain.on('browserWindowResize',(event, data)=>{
    bounds = {x:0, y:90, width: data.width, height: data.height-90}
    vm.setBounds(bounds)
    if(browserWindow.getBrowserView()) {
        browserWindow.getBrowserView().setBounds(bounds)
    }
})

ipcMain.on('closeWindow', (event)=>{
    const win = BrowserWindow.fromWebContents(event.sender)
    win.close()
})