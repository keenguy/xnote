const {BrowserView, ipcMain} = require('electron')

let viewMap = {} // id: view
let viewStateMap = {} // id: view state
let mainWindow = null

let bounds = {x:0, y: 90, height: 713, width:1400};
let id = 0    //

// initialize viewMap[0] to be an empty view
function init() {
    viewMap[0] = new BrowserView()
}

function createView (events) {
    let view = new BrowserView({webPreferences: {
            nodeIntegration: true
        }})

    view.webContents.on('new-window', (event, url, frameName, disposition, options) => {
        event.preventDefault()
        console.log("new-window: ", url)
    })

    view.webContents.on('will-navigate', (event,url)=>{
        event.preventDefault()
        console.log("will-navigate: ", url)
    })

    id++

    view.setBounds(bounds)

    viewMap[id] = view
    viewStateMap[id] = {loadedInitialURL: false}

    return id
}

function setWindow(win){
    mainWindow = win
}

function clearWindow(){
    mainWindow = null
}

function destroyView (id) {
    // destroy an associated partition

    // var partition = viewMap[id].webContents.getWebPreferences().partition
    // if (partition) {
    //     session.fromPartition(partition).destroy()
    // }

    if (mainWindow && viewMap[id] === mainWindow.getBrowserView()) {
        mainWindow.setBrowserView(null)
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
    console.log("set view: ", id)
    if(mainWindow) {
        mainWindow.setBrowserView(viewMap[id])
        if(viewMap[id]) {

            viewMap[id].webContents.openDevTools()
            viewMap[id].setBounds(bounds)
        }
    }
}

function setBounds (bounds) {
    bounds = bounds;
}

function focusView (id) {
    // empty views can't be focused because they won't propogate keyboard events correctly, see https://github.com/minbrowser/min/issues/616
    if (viewMap[id].webContents.getURL() !== '' || viewMap[id].webContents.isLoading()) {
        viewMap[id].webContents.focus()
    } else if(mainWindow){
        mainWindow.webContents.focus()
    }
}

function hideCurrentView () {
    if(mainWindow) {
        mainWindow.setBrowserView(null)
        mainWindow.webContents.focus()
    }
}

function getView (id) {
    return viewMap[id]
}

function loadFileInView(id, filePath, cb){
    console.log("loadfile ", filePath, " in view ", id)
    viewMap[id].webContents.loadFile(filePath).then(()=>{
        if(cb){
            cb()
        }
    })

}

ipcMain.on('createView', function (e, args) {
    createView(args.id, args.webPreferencesString, args.boundsString, args.events)
})

ipcMain.on('destroyView', function (e, id) {
    destroyView(id)
})

ipcMain.on('destroyAllViews', function () {
    destroyAllViews()
})


ipcMain.on('setView', function (e, args) {
    setView(args.id)
    if (args.focus) {
        focusView(args.id)
    }
})

ipcMain.on('setBounds', function (e, args) {
    setBounds(args.id, args.bounds)
})

ipcMain.on('focusView', function (e, id) {
    focusView(id)
})

ipcMain.on('hideCurrentView', function (e) {
    hideCurrentView()
})

function loadURLInView(id, args){
    // wait until the first URL is loaded to set the background color so that new tabs can use a custom background
    if (!viewStateMap[id].loadedInitialURL) {
        viewMap[id].setBackgroundColor('#fff')
    }
    viewStateMap[id].loadedInitialURL = true
    return viewMap[id].webContents.loadURL(args.url)
}

ipcMain.on('callViewMethod', function (e, data) {
    var error, result
    try {
        var webContents = viewMap[data.id].webContents
        result = webContents[data.method].apply(webContents, data.args)
    } catch (e) {
        error = e
    }
    if (data.callId && mainWindow) {
        mainWindow.webContents.send('async-call-result', {callId: data.callId, error, result})
    }
})

ipcMain.on('getCapture', function (e, data) {
    if(!mainWindow) return;
    viewMap[data.id].webContents.capturePage(function (img) {
        var size = img.getSize()
        if (size.width === 0 && size.height === 0) {
            return
        }
        img = img.resize({width: data.width, height: data.height})
        mainWindow.webContents.send('captureData', {id: data.id, url: img.toDataURL()})
    })
})
const vm = {
    createView,
    getView,
    setView,
    loadFileInView,
    loadURLInView,
    setWindow,
    clearWindow,
    setBounds,
    init
}
module.exports = vm
