const {app, BrowserWindow, ipcMain, Menu} = require('electron')

const getMenu = require('./menu.js')
// const url = require('url')
const path = require('path')
const fs = require('fs')
const fsPromise = require('fs').promises
const isDev = (process.env.NODE_ENV === 'development')
const isProd = !require("electron-is-dev");
const Store = require('electron-store');

const {getDocsFun, getSubDir} = require('./docs')
const convert = require('../lib/converter')()


let appPath = app.getAppPath()
console.log("appPath:", appPath)
let buildPath = path.join(appPath, 'build')
if(!isProd){
    appPath = path.join(__dirname, "../..")
    buildPath = appPath
}
const convertOpt = {appPath, buildPath}

console.log("appPath:", appPath)
console.log("buildPath:", buildPath)
console.log("isDev: ", isDev)
console.log("isProd", isProd)

const schema = {
    basePath: {type: 'string', default: '/Users/yonggu/Coding/xnotes'},
    curFilePath: {type: 'string', default: '/Users/yonggu/Coding/xnotes/javascript/promise.md'},
    recentFiles: {type: 'array', default: []}
}
const store = new Store({schema});
let sharedState = {
    needSave: false
}
const getDocs = getDocsFun(store.get('basePath'))

ipcMain.on('log', (event,data)=>{
    console.log('log: ', data)
})
ipcMain.on('getDocs', (event)=>{
    event.returnValue = getDocs()
})

ipcMain.on('getSubDocs', (event, docPath)=>{
    try {
        const basePath = store.get('basePath')
        const relPath = path.relative(basePath, docPath)
        let docs = getSubDir(getDocs(), relPath)
        event.returnValue = docs
    }catch(e){
        event.returnValue = null
    }
})


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
        switch(cmd){
            case 'toViewer':
                viewerWindow && viewerWindow.show()
                break
            case 'toEditor':
                editorWindow && editorWindow.show()
                break
            case 'closeTab':
                viewerWindow && viewerWindow.isFocused() && viewerWindow.webContents.send('closeTab')
                break
            case 'callEditor':
                editorWindow && editorWindow.webContents.send(opt.msg, opt.data)
                break;
            case 'callViewer':
                viewerWindow && viewerWindow.webContents.send(opt.msg, opt.data)
                break
            case 'inspect':
                viewerWindow && viewerWindow.isFocused() && vm.getView(null).webContents.toggleDevTools()
                break
            case 'findInPreview':
                viewerWindow && viewerWindow.isFocused() && vm.sendToView(null, 'find')
                break
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
    const docs = getDocs()
    switch(data.task){
        case 'compile':
            compile(docs, data.override)
            getDocs(true)
            break;
        // case 'genHome':
        //     genHome(dirPath, docs);
        //     getDocs(true)
        //     break;
        case 'clean':
            console.log("begin cleaning")
            clean(docs)
            getDocs(true)
            break;
        case 'refresh':
            getDocs(true)
    }

    event.returnValue = true
})

function clean(docs){
    Object.keys(docs.files).forEach((key)=>{
        const entry = docs.files[key]
        if(entry.files){
            clean(entry)
        }else if(path.extname(entry.path) === '.html'){
            console.log("removing: ", entry.path)
            fs.unlinkSync(entry.path)
        }
    })
}

function compile(dir, override){
    Object.keys(dir.files).forEach((key)=>{
        const entry = dir.files[key]
        if(entry.files){
            compile(entry, override)
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

// viewerWindow.webContents events: newTab, closeWindow, callView
ipcMain.on("newTab", (event, id)=>{
    vm.loadToLoad(id, home)
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

// dom events
ipcMain.on('domWindowResize',(event, data)=>{
    const bounds = {x:0, y:90, width: data.width, height: data.height-90}
    vm.setBounds(bounds)
    if(viewerWindow.getBrowserView()) {
        viewerWindow.getBrowserView().setBounds(bounds)
    }
})

