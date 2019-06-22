var viewMap = {} // id: view
var viewStateMap = {} // id: view state

const {BrowserView, ipcMain} = require('electron')


let id = 0;
function createView () {
    let view = new BrowserView()
    // events = events ||  []
    // events.forEach(function (ev) {
    //     view.webContents.on(ev.event, function (e) {
    //         if (ev.options && ev.options.preventDefault) {
    //             e.preventDefault()
    //         }
    //         viewWindow.webContents.send('view-event', {
    //             viewId: id,
    //             eventId: ev.id,
    //             args: Array.prototype.slice.call(arguments).slice(1)
    //         })
    //     })
    // })
    id++;
    // main process send message to view? why not send to viewWindow directly?
    view.webContents.on('ipc-message', function (e, channel, data) {
        viewWindow.webContents.send('view-ipc', {
            id: id,
            name: channel,
            data: data
        })
    })

    view.setBounds({x:0, y: 87, height: 713, width:1400})

    viewMap[id] = view
    viewStateMap[id] = {loadedInitialURL: false}

    return id
}

function destroyView (id) {
    // destroy an associated partition

    // var partition = viewMap[id].webContents.getWebPreferences().partition
    // if (partition) {
    //     session.fromPartition(partition).destroy()
    // }
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
    viewWindow.setBrowserView(viewMap[id])
}

function setBounds (id, bounds) {
    viewMap[id].setBounds(bounds)
}

function focusView (id) {
    // empty views can't be focused because they won't propogate keyboard events correctly, see https://github.com/minbrowser/min/issues/616
    if (viewMap[id].webContents.getURL() !== '' || viewMap[id].webContents.isLoading()) {
        viewMap[id].webContents.focus()
    } else {
        viewWindow.webContents.focus()
    }
}

function hideCurrentView () {
    viewWindow.setBrowserView(null)
    viewWindow.webContents.focus()
}

function getView (id) {
    return viewMap[id]
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
    setBounds(args.id, args.bounds)
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

ipcMain.on('loadURLInView', function (e, args) {
    // wait until the first URL is loaded to set the background color so that new tabs can use a custom background
    if (!viewStateMap[args.id].loadedInitialURL) {
        viewMap[args.id].setBackgroundColor('#fff')
    }
    viewMap[args.id].webContents.loadURL(args.url)
    viewStateMap[args.id].loadedInitialURL = true
})

// ipcMain.on('callViewMethod', function (e, data) {
//     var error, result
//     try {
//         var webContents = viewMap[data.id].webContents
//         result = webContents[data.method].apply(webContents, data.args)
//     } catch (e) {
//         error = e
//     }
//     if (data.callId) {
//         viewWindow.webContents.send('async-call-result', {callId: data.callId, error, result})
//     }
// })

// ipcMain.on('getCapture', function (e, data) {
//     viewMap[data.id].webContents.capturePage(function (img) {
//         var size = img.getSize()
//         if (size.width === 0 && size.height === 0) {
//             return
//         }
//         img = img.resize({width: data.width, height: data.height})
//         viewWindow.webContents.send('captureData', {id: data.id, url: img.toDataURL()})
//     })
// })

const vm = {
    createView,
    getView,
    setView
}

module.exports = vm;