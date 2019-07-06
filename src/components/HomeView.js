import React from 'react'

import {FileItem, DirList} from './shared'

import path from 'path'

class Program extends React.Component {
    render() {
        const disabled = (this.props.running === true ? 'disabled' : '')
        return (
            <div id="program" className="wrapper"
                 style={{display: this.props.view === 'program' ? 'flex' : 'none'}}>
                <h2>Workspace: {this.props.dirPath}</h2>
                <div>
                    <i className={`fa fa-play ${disabled}`} onClick={this.props.exec.bind(null, 'compile', false)}></i>
                    <span>Compile all updated md files </span>
                </div>
                <div>
                    <i className={`fa fa-forward ${disabled}`}
                       onClick={this.props.exec.bind(null, 'compile', true)}></i>
                    <span>Compile all md files</span>
                </div>
                <div>
                    <i className={`fa fa-trash ${disabled}`} onClick={this.props.exec.bind(null, 'clean', false)}></i>
                    <span>Remove all html files</span>
                </div>
                <div>
                    <i className={`fa fa-refresh ${disabled}`}
                       onClick={this.props.exec.bind(null, 'refresh', false)}></i>
                    <span>Reload local files </span>
                </div>
            </div>
        )
    }
}

class HomeView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            view: 'recent',
            filterText: '',
            extFilter: '.md',
            running: false
        }


        this.changeView = this.changeView.bind(this);
        this.updateFileList = this.updateFileList.bind(this)
        this.execProgram = this.execProgram.bind(this)
        this.filter = this.filter.bind(this)
        this.changeExtFilter = this.changeExtFilter.bind(this)
    }

    componentDidMount() {
        this.searchBar = document.getElementById('home_search')

    }

    changeView(view) {
        this.setState({
            view: view
        })
    }

    /* workspace */
    updateFileList() {
        const text = this.searchBar.value.toLowerCase();
        this.setState({filterText: text})
    }


    /* program */
    execProgram(task, override) {
        this.setState({running: true})
        setTimeout(() => {
            this.props.processDirSync(null, task, override)
            this.setState({running: false})
        }, 0)
        // switch (task) {
        //     case 'compile':
        //     case 'refresh':
        //     case 'clean':
        //         this.setState({running: true})
        //         setTimeout(() => {
        //             this.props.processDirSync(null, task, override)
        //             this.setState({running: false})
        //         }, 0)
        //         break;
        // }
    }
    changeExtFilter(e){
        this.setState({extFilter: e.target.value})
    }
    filter(file) {
        return (!this.state.extFilter || path.extname(file) === this.state.extFilter) && file.indexOf(this.state.filterText) > -1
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
                        <li onClick={this.changeView.bind(null, 'recent')}>Recent</li>
                        <li onClick={this.changeView.bind(null, 'workspace')}>Workspace</li>
                        <li onClick={this.changeView.bind(null, 'program')}>Program</li>
                    </ul>
                </div>
                <div id="home-main">
                    <div id="recent" className="wrapper"
                         style={{display: this.state.view === 'recent' ? 'flex' : 'none'}}>
                        <h2>Recent</h2>
                        <ul>
                            {recent_list}
                        </ul>
                    </div>
                    <div id="home-workspace" className="wrapper"
                         style={{display: this.state.view === 'workspace' ? 'flex' : 'none'}}>
                        <h2>Workspace: {this.props.dirPath}</h2>
                        <div><input id="home_search" type="text" placeholder="Search.." onKeyUp={this.updateFileList}/>
                            <select value={this.state.filterExt} onChange={this.changeExtFilter}>
                                <option value='.md'>md</option>
                                <option value='.yml'>yml</option>
                                <option value='.html'>html</option>
                                <option value=''>all</option>
                            </select>
                        </div>

                        <div className="file-list">
                            <DirList openFile={this.props.openFile} dirPath={this.props.dirPath}
                                     filters={[this.filter]}/>
                        </div>
                    </div>
                    <Program running={this.state.running}
                             exec={this.execProgram}
                             dirPath={this.props.dirPath}
                             view={this.state.view}/>
                </div>
            </div>
        );
    }
}

export default HomeView