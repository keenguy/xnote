const {app, BrowserWindow, viewView, ipcMain, Menu} = require('electron')

const md = require('../lib/markdown.js');
const getMenu = require('./menu.js')
// const url = require('url')
const path = require('path')
const fs = require('fs')
const fsPromise = require('fs').promises
const isDev = require("electron-is-dev");
const Store = require('electron-store');



const schema = {
    basePath: {type: 'string', default: '/Users/yonggu/Coding/xnotes'},
    curFilePath: {type: 'string', default: '/Users/yonggu/Coding/xnotes/javascript/promise.md'},
    recentFiles: {type: 'array', default: []}
}
const store = new Store({schema});
let sharedState = {
    needSave: false
}
global.sharedObject = {
    state: sharedState,
    store: store
}


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
        if (cmd === 'toViewer' && viewerWindow) {
            viewerWindow.show();
        } else if (cmd === 'toEditor' && editorWindow) {
            editorWindow.show();
        } else if (cmd === 'closeTab') {
            if (viewerWindow && viewerWindow.isFocused()) {
                // console.log("close Tab in preview window")
                viewerWindow.webContents.send('closeTab')
            }
        }
        else if (cmd === 'callEditor' && editorWindow) {
            editorWindow.webContents.send(opt.msg, opt.data);
        }
        else if (cmd === 'callViewer' && viewerWindow) {
            viewerWindow.webContents.send(opt.msg, opt.data);
        } else if (cmd === 'findInPreview' && viewerWindow && viewerWindow.isFocused){
            viewerWindow.webContents.send('find')
        }
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
ipcMain.on('preview', (event, file) => {
    let fp = file.path
    const title = path.basename(fp)
    console.log("preview: ", title, " at ", file.path)

    const pos = fp.indexOf('.')
    fp = fp.substr(0, pos > -1 ? pos : fp.length) + '.html'

    showPreview(title, file.content, fp)

})

async function showPreview(title, content, fp) {
    let html = await md.render(content);
    const p = path.join(__dirname, '../pages/preview.html')
    let url

    const args={
        title: title,
        url: `file://${fp}`,
        data:{content: html, toc: md.output.tocHtml, path: fp}
    }
    openviewerWindow(()=>{
        vm.loadURLInNewView(args)
    })

}

//asynchronous, sync markdown and html windows.
ipcMain.on('sync', (event, data) => {
    // console.log("sync: ", data.line)
    let idx = data.toWin;
    if (idx < 0 || idx >= 2) return;
    const window = idx == 0 ? editorWindow : viewerWindow
    // window.webContents.send('sync', data.line);
    window.show();
})


// ipcMain.on('preview', (event, data) => {
//     // if (!data.save && preview_win) return;
//
//     const p = data.file.path;
//     const pos = p.lastIndexOf(".");
//     const title = p.substr(0, pos < 0 ? p.length : pos) + ".html";
//
//     showPreview(data, title);
// })

//synchronous
ipcMain.on('readFile', (event,data)=>{
    try{
        let content = fs.readFileSync(data.path, {encoding: 'utf8'})
        event.returnValue = {content: content}
    }catch{
        event.returnValue = {err: true}
    }
})

ipcMain.on('writeFile', (event, data) => {
    try{
        fs.writeFileSync(data.path, data.content, {encoding: 'utf8'})
        event.returnValue = {err: false}
    }catch{
        event.returnValue = {err: true}
    }
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
    if(viewerWindow.getBrowserView()) {
        viewerWindow.getBrowserView().setBounds(bounds)
    }
})

