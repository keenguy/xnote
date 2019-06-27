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
        this.saveFile();
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
                                 openFile={this.props.openFile}
                                 file={this.props.file} show={this.state.nav === 1}/>
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

export default EditView