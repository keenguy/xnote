const {BrowserWindow, BrowserView} = require('electron')

class ViewManager{
    constructor(){
        this.viewMap = {}     // id: view , to store BrowserViews
        this.nextId = 1;
    }

    addView(win, filePath, events){
        const view = createBrowserView(win)
        console.log("loading file: ", filePath)
        const p = view.webContents.loadFile(filePath);

        const id = this.nextId;
        this.nextId++;
        this.viewMap[id] = view;

        p.then(()=>{
            events.forEach((event)=>{
                event.data = Object.assign({viewId: id}, event.data)
                win.webContents.send(event.name, event.data)
            })

        })

        return id;
    }

    getView(id){
        return this.viewMap[id]
    }

}

function createBrowserView(win) {
    let view;
    view = new BrowserView()
    win.setBrowserView(view)
    view.setBounds({x: 0, y: 91, width: 600, height: 600})
    return view;
}

vm = new ViewManager();
module.exports = vm;