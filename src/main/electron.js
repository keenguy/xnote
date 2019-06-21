const {app, BrowserWindow, BrowserView, ipcMain, Menu, dialog} = require('electron')
// const isDev = require('electron-is-dev')
// const md = require('./lib/markdown.js');
const getMenu = require('./menu.js')
// const url = require('url')
const path = require('path')
// const fs = require('fs')
const isDev = require("electron-is-dev");
// const Store = require('electron-store');
// const main = require('file-loader?name=[name].[ext]!../public/main.html');


let windows = [null, null]
let urls = ["pages/index.html", "pages/preview.html"]
let viewMap = {}     // id: view , to store BrowserViews

app.on('ready', () => {
    openWindow(0);
    function menuAction(cmd, opt) {
        if (cmd === 'toPreview' && windows[1]) {
            windows[1].show();
        } else if (cmd === 'toIndex' && windows[0]) {
            windows[0].show();
        }
        // else if (cmd === 'callEdit' && windows[0]) {
        //     windows[0].webContents.send(opt.msg, opt.data);
        // } else if (cmd === 'callPreview' && windows[1]) {
        //     windows[1].webContents.send(opt.msg, opt.data);
        // } else if (cmd === 'findInPreview' && windows[1] && windows[1].isFocused){
        //     windows[1].webContents.send('find')
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
    openWindow(0);
})


function openWindow(idx) {
    const opts = {
        width: 1400,
        height: 880,
        show: true,
        movable: true,
        webPreferences: {
            nodeIntegration: true
        }
    }
    if (idx === 1){
        opts.titleBarStyle = 'hiddenInset'
    }
    if (!windows[idx]) {
        windows[idx] = new BrowserWindow(opts)
        if (isDev) {
            windows[idx].loadURL("http://localhost:3000/" + urls[idx])
        } else {
            const p = path.join(__dirname, "../", urls[idx])
            windows[idx].webContents.loadURL(`file://${p}`)
        }
        windows[idx].on('closed', () => {
            windows[idx] = null;
        })
    } else {
        windows[idx].show();
    }
}


id = 0;

function createBrowserView() {
    let view;
    view = new BrowserView()
    windows[1].setBrowserView(view)
    view.setBounds({x: 0, y: 83, width: 600, height: 600})
    viewMap[id++] = view;
    return view;
}

ipcMain.on('preview', (event, data) => {
    console.log("preview: ", data.path)
    openWindow(1);

    // windows[1].webContents.openDevTools()
    const view = createBrowserView()
    const p = path.join(__dirname, "../../test", data.path)
    view.webContents.loadFile(p);
    // view.webContents.openDevTools()
    // windows[1].webContents.loadURL(`file://${p}`)

})