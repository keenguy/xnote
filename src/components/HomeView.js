import React from 'react'

import {FileItem, DirList} from './shared'

class HomeView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            view: 'recent',
            filterText: ''
        }
        this.changeView.bind(this);
        this.updateFileList = this.updateFileList.bind(this)
    }
    componentDidMount() {
        this.searchBar = document.getElementById('home_search')
    }

    changeView(view) {
        this.setState({
            view: view
        })
    }
    updateFileList(){
        const text = this.searchBar.value.toLowerCase();
        this.setState({filterText: text})
    }
    render() {
        let files = this.props.recentFiles;
        let recent_list = [];

        for (let file of files) {
            let p = file.path;
            recent_list.push(<FileItem key={p} file={file} openFile={this.props.openFile}/>)
        }
        recent_list.reverse();
        return (
            <div id="home" className="tabview" style={{display: this.props.show ? 'flex' : 'none'}}>
                <div id="home-left">
                    <ul>
                        <li onClick={() => this.changeView('recent')}>Recent</li>
                        <li onClick={() => this.changeView('workspace')}>Workspace</li>
                    </ul>
                </div>
                <div id="home-main">
                    <div id="recent" className="wrapper" style={{display: this.state.view === 'recent' ? 'flex' : 'none'}}>
                        <h2>Recent</h2>
                        <ul>
                            {recent_list}
                        </ul>
                    </div>
                    <div id="home-workspace" className="wrapper"
                         style={{display: this.state.view === 'workspace' ? 'flex' : 'none'}}>
                        <h2>Workspace: {this.props.dirPath}</h2>
                        <div><input id="home_search" type="text" placeholder="Search.." onKeyUp={this.updateFileList}/></div>
                        <div className="file-list">
                            <DirList openFile={this.props.openFile} dirPath={this.props.dirPath} filter={this.state.filterText}/>
                        </div>
                    </div>
                </div>
            </div>
    );
    }
    }

    export default HomeView