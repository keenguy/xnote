import {Controlled as CodeMirror} from "react-codemirror2";
import React from 'react'

import {EditTOC, EditPrj} from './shared'

const {ipcRenderer} = window.require('electron')

class EditView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            init: true,
            needSave: false,
            nav: 0
        }
        this.preview = this.preview.bind(this)
        this.toggleNav = this.toggleNav.bind(this)
        this.jumpTo = this.jumpTo.bind(this)
        this.cm = null;
    }

    componentDidMount() {
        dragElement(document.getElementById("separator"), "H");

        ipcRenderer.on("sync", (event, line) => {
            this.props.changeView('edit');
            console.log("jumpTo: ", line)
            this.jumpTo(line)
        })
        ipcRenderer.on("preview", (event, line) => {
            this.preview();
        })

        this.cm.on('mousedown', (cm, event) => {
            if (event.ctrlKey) {
                const line = cm.coordsChar({left: event.pageX, top: event.pageY}).line;
                ipcRenderer.send('sync', {toWin: 1, line: line, path: this.props.file.path})
            }
        })
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        this.cm.refresh();
    }

    componentWillUnmount() {
        // this.saveFile();
    }

    toggleNav(idx){
        this.setState({nav:idx})
    }
    jumpTo(lineNo) {
        lineNo = parseInt(lineNo, 10)
        console.log("jump to: ", lineNo);

        this.cm.scrollIntoView({line: lineNo, ch: 0}, 330)
        const marker = this.cm.markText({line: lineNo, ch: 0}, {
            line: lineNo + 1,
            ch: 0
        }, {css: "background-color: #fe3"})
        setTimeout(() => {
            marker.clear()
        }, 1200)
    }

    preview() {
        this.props.saveFile()
        ipcRenderer.send('preview', this.props.file);
    }

    render() {
        const options = {
            lineNumbers: true,
            lineWrapping: true,
            mode: 'markdown',
            placeholder: 'Code goes here...'
        };

        return (
            <div id="edit" className="tabview" style={{display: this.props.show ? 'flex' : 'none'}}>
                <div className="tool-bar bar">
                    <span><i className={`fa fa-save ${this.props.file.needSave ? 'active' : null}`}
                             onClick={this.props.saveFile}></i></span>
                    <span><i className="fa fa-eye" onClick={this.preview}></i></span>
                </div>
                <div id="edit-main">
                    <div id="edit-left" style={{display: this.props.sidebar ? 'flex' : 'none'}}>
                        <div className="bar left-bar">
                            <i className="fa fa-bookmark-o" onClick={()=>this.toggleNav(0)}></i>
                            <i className="fa fa-book" onClick={()=>this.toggleNav(1)}></i>
                        </div>
                        <EditTOC file={this.props.file} jumpTo={this.jumpTo} show={this.state.nav === 0}/>
                        <EditPrj basePath={this.props.basePath}
                                 file={this.props.file}
                                 openFile={this.props.openFile}
                                 show={this.state.nav === 1}/>
                        <div id="separator"></div>
                    </div>

                    <div id="editor" className="editor ">
                        <CodeMirror
                            // key={this.props.file}
                            editorDidMount={editor => {
                                this.cm = editor
                            }}
                            value={this.props.file.content}
                            options={options}
                            onBeforeChange={(editor, data, value) => {
                                this.props.changeFileContent(value);
                            }}
                            onChange={(editor, data, value) => {
                                if (this.state.init) {
                                    this.setState({init: false});
                                } else {
                                    this.setState({needSave: true});
                                }
                            }}
                        />
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

export default EditView