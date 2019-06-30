const {app, BrowserWindow, viewView, ipcMain, Menu} = require('electron')

const getMenu = require('./menu.js')
// const url = require('url')
const path = require('path')
const fs = require('fs')
const fsPromise = require('fs').promises
const isDev = require("electron-is-dev");
const Store = require('electron-store');

const {walkDirSync} = require('../utils/dir')
const convert = require('../lib/converter')()


let appPath = app.getAppPath()
let buildPath = path.join(appPath, 'build')
if(isDev){
    appPath = path.join(__dirname, "../..")
    buildPath = appPath
}
const convertOpt = {appPath, buildPath}



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
    const title = path.basename(fp, '.md')
    convert({title:title, content: file.content, filePath: fp}, convertOpt)

    const pos = fp.indexOf('.')
    fp = fp.substr(0, pos > -1 ? pos : fp.length) + '.html'
    showPreview(title, fp)
})

ipcMain.on('openHtml', (event,file)=>{
    if(!file.title){
        file.title = path.basename(file.path)
    }
    showPreview(file.title, file.path)
})


async function showPreview(title, fp) {
    const args={
        title: title,
        url: `file://${fp}`,
    }
    openviewerWindow(()=>{
        vm.loadURLInNewView(args)
    })
}

ipcMain.on('processDirSync', (event, data)=>{
    const dirPath = data.dirPath || store.get('basePath')
    console.log(data.task, dirPath)
    const files = walkDirSync(dirPath)
    switch(data.task){
        case 'render':
            compile(files, data.override)
            break;
        case 'genHome':
            genHome(dirPath, files);
            break;
        case 'clean':
            console.log("begin cleaning")
            clean(files)
            break;
    }
    event.returnValue = true
})

function clean(files){
    files.forEach((entry)=>{
        if(entry.files){
            clean(entry.files)
        }else if(path.extname(entry.path) === '.html'){
            console.log("removing: ", entry.path)
            fs.unlinkSync(entry.path)
        }
    })
}

function compile(files, override){
    files.forEach((entry)=>{
        if(entry.files){
            compile(entry.files,override)
        }else if(path.extname(entry.path) === '.md'){
            const mdPath = entry.path
            const htmlPath = mdPath.substr(0, mdPath.length - 3) + '.html'
            if(override || !fs.existsSync(htmlPath)){
                console.log("rending", mdPath)
                const src = {title: path.basename(mdPath,'.md'), filePath: mdPath}
                convert(src,convertOpt)
                console.log("render", htmlPath, "done")
            }
        }
    })
}

//asynchronous, sync markdown and html windows.
ipcMain.on('sync', (event, data) => {
    // console.log("sync: ", data.line)
    let idx = data.toWin;
    if (idx < 0 || idx >= 2) return;
    if(idx == 1 && viewerWindow){
        viewerWindow.getBrowserView().webContents.send('sync', data.line)
        viewerWindow.show()
    }else if(editorWindow) {
        editorWindow.webContents.send('sync', data.line);
        editorWindow.show()
    }
})

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

// viewerWindow.webContents events: newTab, closeWindow, callView
ipcMain.on("newTab", (event, id)=>{
    vm.loadToLoad(id, home)
})

ipcMain.on('closeWindow', (event)=>{
    const win = BrowserWindow.fromWebContents(event.sender)
    win.close()
})

ipcMain.on('callView', (event, data)=>{
    let wc = null
    try {
        wc = vm.getView(data.id).webContents
        if(!wc || !data.fun) return;
        wc[data.fun]()
    }catch{
        return
    }
})

// ipcMain.on("goBackOrForward", (event, data) => {
//     if (viewerWindow) {
//         if (data.back) {
//             vm.getView(data.viewId).webContents.goBack();
//         } else {
//             vm.getView(data.viewId).webContents.goForward();
//         }
//     }
// })



// dom events
ipcMain.on('domWindowResize',(event, data)=>{
    const bounds = {x:0, y:90, width: data.width, height: data.height-90}
    vm.setBounds(bounds)
    if(viewerWindow.getBrowserView()) {
        viewerWindow.getBrowserView().setBounds(bounds)
    }
})

