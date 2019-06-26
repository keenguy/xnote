// In the main process.
const {app, BrowserView, BrowserWindow } = require('electron')

const path = require('path')





app.on('ready', ()=> {
    let win = new BrowserWindow({width: 1400, height: 800})
    win.loadFile(path.join(__dirname,'./b.html'))
    win.on('closed', () => {
        win = null
    })

    let view = new BrowserView()
    win.setBrowserView(view)
    view.setBounds({x: 0, y: 87, width: 200, height: 713})
    view.webContents.loadFile(path.join(__dirname,'./a.html'))
})