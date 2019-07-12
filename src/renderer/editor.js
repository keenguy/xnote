import React from 'react'
import ReactDOM from 'react-dom'
import fs from 'fs'

import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/addon/display/placeholder.js'
import 'codemirror/addon/search/search.js'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/jump-to-line.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import "../../assets/style/font-awesome-4.7.0/css/font-awesome.min.css"
import '../../assets/style/codemirror.css'

import '../../assets/style/editor.css'

import HomeView from '../components/HomeView'
import EditView from '../components/EditView'
import {Info} from '../components/shared'

const {ipcRenderer, remote} = window.require('electron');

class Editor extends React.Component {
    constructor(props) {
        super(props);
        // config = ipcRenderer.sendSync('getDataSync','config');
        let sharedObject = remote.getGlobal('sharedObject')
        this.store = sharedObject.store;
        // this.infoElm = document.getElementById('info');
        this.sharedState = sharedObject.state
        // this.docs = sharedObject.getDocs()
        // this.getDoc = sharedObject.getDoc;

        this.state = {
            view: 'edit',
            sidebar: true,
            file: {path: '', content: '', needSave: false},
            recentFiles: this.store.get('recentFiles'),
            info: {content: '', level: 0}
        }
        this.openFile = this.openFile.bind(this)
        this.saveFile = this.saveFile.bind(this)
        this.changeFileContent = this.changeFileContent.bind(this)
        this.changeView = this.changeView.bind(this)
        this.toggleSideBar = this.toggleSideBar.bind(this)
        this.showInfo = this.showInfo.bind(this)
        this.processDirSync = this.processDirSync.bind(this)
    }

    componentDidMount() {
        dragElement(document.getElementById("separator"), "H");
        this.openFile(this.store.get('curFilePath'))

        this.docs = ipcRenderer.send('getDocs')

        ipcRenderer.on('save', () => {
            this.saveFile();
        })

        window.onbeforeunload = (e) => {
            this.saveFile()
        }
    }

    openFile(p) {
        console.log("open file: ", p)

        if (this.saveFile()) {
            // let res = ipcRenderer.sendSync('readFile', {path: p})
            try {
                const content = fs.readFileSync(p, {encoding: 'utf8'})

                let file = {path: p, content: content, needSave: false}
                let recentFiles = this.state.recentFiles;
                this.addRecentFiles(recentFiles, p);
                this.setState({file: file, recentFiles: recentFiles, view: 'edit'})
                this.store.set('curFilePath', p);
                this.store.set('recentFiles', recentFiles);
                document.title = p;
            } catch (e) {
                alert('open File error: ' + p)
            }
        }
    }

    addRecentFiles(recentFiles, p) {
        for (let i = 0; i < recentFiles.length; i++) {
            if (recentFiles[i].path === p) {
                recentFiles.splice(i, 1)
            }
        }
        if (recentFiles.length >= 50) {
            recentFiles.shift();
        }
        recentFiles.push({path: p, date: new Date()})
    }

    saveFile() {
        const file = this.state.file;
        if (!file.needSave) return true;
        // let res = {err: false};
        // let res = ipcRenderer.sendSync('writeFile', {path: file.path, content: content})
        try {
            fs.writeFileSync(file.path,file.content,{encoding:'utf8'})
            this.showInfo({content: 'file saved ^_^'}, 1200)
            file.needSave = false;
            this.sharedState.needSave = false;
            this.setState({file: file})
        } catch (e) {
            alert('save file error')
        }
        return true;
    }

    changeFileContent(content) {

        let file = this.state.file;
        file.content = content;
        file.needSave = true;
        this.sharedState.needSave = true;
        this.setState({file: file})
    }

    changeView(view) {
        this.setState({view: view});
    }

    showInfo(info, time) {
        const oldInfo = this.state.info;
        if (!info.level) {
            info.level = 0;
        }
        this.setState({info: info});
        if (time) {
            setTimeout(() => {
                this.setState({info: oldInfo})
            }, time)
        }
    }

    toggleSideBar() {
        const next = !this.state.sidebar;
        this.setState({sidebar: next})
    }

    processDirSync(dirPath, task, override) {
        return ipcRenderer.sendSync('processDirSync', {dirPath: dirPath, task: task, override: override})
    }

    render() {
        return (
            <div className="editview">
                <div className="header-bar bar">
                    <span id="home_btn" onClick={() => this.changeView('home')} className="btn"> Home </span>
                    <span id="edit_btn" onClick={() => this.changeView('edit')} className="btn">Edit</span>
                </div>

                <div id="main">
                    <HomeView openFile={this.openFile} dirPath={this.store.get('basePath')}
                              show={this.state.view === 'home'}
                              recentFiles={this.state.recentFiles}
                              processDirSync={this.processDirSync}
                    />
                    <EditView basePath={this.store.get('basePath')}
                              openFile={this.openFile}
                              file={this.state.file}
                              saveFile={this.saveFile}
                              changeFileContent={this.changeFileContent}
                              show={this.state.view === 'edit'}
                              sidebar={this.state.sidebar}
                              changeView={this.changeView} log={this.showInfo}/>
                </div>
                <div className="footer-bar bar">
                    <div className='footer-left'>
                        <i className="fa fa-columns" onClick={this.toggleSideBar}></i>
                    </div>
                    <Info info={this.state.info}/>
                    <div className='footer-right'>

                    </div>
                </div>
            </div>
        );
    }

}

/* helpers */


// function is used for dragging and moving
function dragElement(element, direction) {
    let md; // remember mouse down info
    const first = document.getElementById("edit-left");
    const second = document.getElementById("editor");

    element.onmousedown = onMouseDown;

    function onMouseDown(e) {
        //console.log("mouse down: " + e.clientX);
        md = {
            e,
            offsetLeft: element.offsetLeft,
            offsetTop: element.offsetTop,
            firstWidth: first.offsetWidth,
            secondWidth: second.offsetWidth
        };
        document.onmousemove = onMouseMove;
        document.onmouseup = () => {
            //console.log("mouse up");
            document.onmousemove = document.onmouseup = null;
        }
    }

    function onMouseMove(e) {
        //console.log("mouse move: " + e.clientX);
        var delta = {
            x: e.clientX - md.e.x,
            y: e.clientY - md.e.y
        };

        if (direction === "H") // Horizontal
        {
            // prevent negative-sized elements
            delta.x = Math.min(Math.max(delta.x, -md.firstWidth),
                md.secondWidth);

            element.style.left = md.offsetLeft + delta.x + "px";
            first.style.width = (md.firstWidth + delta.x) + "px";
            second.style.width = (md.secondWidth - delta.x) + "px";
        }
    }
}


const editor = document.getElementById('root')
ReactDOM.render(<Editor/>, editor)