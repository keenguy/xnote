const {BrowserView, ipcMain} = require('electron')

const isDev = require('electron-is-dev')
let viewMap = {} // id: view
let viewStateMap = {} // id: view state
let mainWindow = null
let toLoad = null


let bounds = {x: 0, y: 90, height: 790, width: 1400};

function createView(id, events) {
    let view = new BrowserView({
        webPreferences: {
            nodeIntegration: true
        }
    })

    view.webContents.on('new-window', (event, url, frameName, disposition, options) => {
        event.preventDefault()
        console.log("new-window: ", url)
        this.loadURLInNewView({url: url})
    })

    view.webContents.on('did-start-navigation', (event, url)=>{
        mainWindow.send('updateTab', {url:url, id:id})
    })
    
    view.webContents.on('page-title-updated', (event, title)=>{
        console.log("View ", id, " updateTab title: ", title)
        mainWindow.send('updateTab', {id:id, title: title})
    })

    view.setBounds(bounds)

    viewMap[id] = view
    viewStateMap[id] = {loadedInitialURL: false}

    return id
}


function setWindow(win) {
    mainWindow = win
}

function clearWindow() {
    mainWindow = null
}

function destroyView(id) {
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

function destroyAllViews() {
    for (let id in viewMap) {
        destroyView(id)
    }
}

function setView(id) {
    console.log("set view: ", id)
    if (mainWindow) {
        mainWindow.setBrowserView(viewMap[id])
        if (viewMap[id]) {
            if(isDev) {
                viewMap[id].webContents.openDevTools()
            }
            viewMap[id].setBounds(bounds)
        }
        mainWindow.setBrowserView(viewMap[id])
    }

}

function setBounds(bs) {
    bounds = bs;
}

function focusView(id) {
    // empty views can't be focused because they won't propogate keyboard events correctly, see https://github.com/minbrowser/min/issues/616
    if (viewMap[id] && (viewMap[id].webContents.getURL() !== '' || viewMap[id].webContents.isLoading())) {
        viewMap[id].webContents.focus()
    } else if (mainWindow) {
        mainWindow.webContents.focus()
    }
}

function hideCurrentView() {
    if (mainWindow) {
        mainWindow.setBrowserView(null)
        mainWindow.webContents.focus()
    }
}

function getView(id) {
    return viewMap[id]
}

function loadURLInView(id, args) {
    console.log("loadURL ", args.url, " in view ", id)

    // wait until the first URL is loaded to set the background color so that new tabs can use a custom background
    if (!viewStateMap[id].loadedInitialURL) {
        viewMap[id].setBackgroundColor('#fff')
    }
    viewStateMap[id].loadedInitialURL = true
    return viewMap[id].webContents.loadURL(args.url)
}

function loadURLInNewView(args) {
    toLoad = args       // load on event "newTab"
    mainWindow.webContents.send('newTabWithView', args)

}

function loadToLoad(id){
    if(toLoad) {
        this.createView(id)
        const data = toLoad.data
        this.loadURLInView(id, toLoad)
        toLoad = null
    }
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
    if (!mainWindow) return;
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
    loadURLInView,
    loadURLInNewView,
    setWindow,
    clearWindow,
    setBounds,
    loadToLoad
}
module.exports = vm
