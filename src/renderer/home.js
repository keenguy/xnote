import ReactDOM from "react-dom";
import React from "react";
import path from 'path'

import {DirList} from '../components/shared'
import '../../assets/style/home.css'
const {remote, ipcRenderer} = window.require('electron')

class HomePage extends React.Component{
    constructor(props){
        super(props)
        this.state={
            filterText: ''
        }
        let sharedObject = remote.getGlobal('sharedObject')
        this.dirPath = sharedObject.store.get('basePath')
        this.updateFileList = this.updateFileList.bind(this)
        this.openFile = this.openFile.bind(this)
    }
    componentDidMount() {
        this.searchBar = document.getElementById('home_search')
    }

    updateFileList() {
        const text = this.searchBar.value.toLowerCase();
        console.log("update filter: ", text)

        this.setState({filterText: text})
    }
    openFile(filePath){
        ipcRenderer.send('openHtml', {path:filePath})
    }

    render(){
        return (
            <div id="home">
                <h2>Workspace: {this.props.dirPath}</h2>
                <div><input id="home_search" type="text" placeholder="Search.." onKeyUp={this.updateFileList}/>
                </div>
                <div className="file-list">
                    <DirList dirPath={this.dirPath}
                             openFile={this.openFile}
                             filter={this.state.filterText}
                             exts='.html'
                             basePath={path.join(__dirname,'../pages/home.html')}
                    />
                </div>
            </div>
        )
    }
}

const root = document.querySelector('#root');
ReactDOM.render(<HomePage />, root);