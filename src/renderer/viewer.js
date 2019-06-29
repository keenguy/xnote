import React from 'react'
import ReactDOM from 'react-dom'
import "material-design-icons/iconfont/material-icons.css"
import '../../assets/style/viewer.css'
import TabList from './js/TabList'

import './js/initPreview.js'

const {ipcRenderer, webContents} = window.require('electron')

class Tabs extends React.Component {

    render() {
        const tabList = this.props.tabList;
        const selected = tabList.getIndexOfSelected();
        const tabs = tabList.map((tab, idx) => {
            const title = tab.title || "New Tab"
            const wrapperClasses = `tab-item-wrapper${tab.selected ? ' active' : ''}`
            let itemClasses = `tab-item${tab.selected ? ' active' : ''}`
            if (idx === selected || idx === selected - 1) {
                itemClasses += ' no-border'
            }

            return (
                <div className={wrapperClasses} key={tab.id}>
                    <div className={itemClasses}>
                        <span onClick={this.props.clickTab.bind(null, tab.id)}>{title}</span>
                        <i className="material-icons md-14" onClick={this.props.closeTab.bind(null, tab.id)}>close</i>
                    </div>
                </div>
            );
        })
        return (
            <div id="tabs">
                {tabs}
            </div>
        );
    }
}

class NavBar extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const url = this.props.tabList.getURLOfSelected()

        return (
            <div id="nav-bar">
                <div className="nav-btns">
                    <i className={`material-icons${this.props.canGoBack ? '' : ' disabled'}`}
                       onClick={this.props.goBackOrForward.bind(null, true)}>arrow_back</i>
                    <i className={`material-icons${this.props.canGoForward ? '' : ' disabled'}`}
                       onClick={this.props.goBackOrForward.bind(null, false)}>arrow_forward</i>
                </div>

                <div id='place'>
                    <span>{url}</span>
                </div>

            </div>
        );
    }
}

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.viewsMap = {}
        this.nextID = 0;

        this.tabList = new TabList()

        this.state = {
            update: true,
            canGoBack: true,
            canGoForward: true
        }
        this.clickTab = this.clickTab.bind(this)
        this.closeTab = this.closeTab.bind(this)
        this.openTab = this.openTab.bind(this)
        this.update = this.update.bind(this)
        this.goBackOrForward = this.goBackOrForward.bind(this)
    }

    componentDidMount() {
        ipcRenderer.on('closeTab', () => {
            this.closeTab()
        })

        ipcRenderer.on('newTabWithView', (event, data) => {
            this.openTab(null, data)
        })

        ipcRenderer.on('updateTab', (event, data) => {
            console.log("updateTab", data)
            const id = data.id
            delete data.id
            this.tabList.update(id, data)
            this.update()
        })


        window.addEventListener('resize', () => {
            ipcRenderer.send("domWindowResize", {height: window.innerHeight, width: window.innerWidth})
        });
        // init();
        this.update();
    }

    goBackOrForward(back) {
        const viewId = this.tabList.getSelected()
        if (viewId) {
            ipcRenderer.send('goBackOrForward', {viewId: viewId, back: back})
        }
    }

    openTab(tabId, opt) {
        console.log("open Tab: ", tabId)
        opt = opt || {}
        if (tabId) {
            this.tabList.update(tabId, opt)
        } else {
            tabId = this.tabList.add({
                url: opt.url || "",
                title: opt.title || "New Tab",
            }, this.tabList.count())
            ipcRenderer.send('newTab', tabId)
        }
        this.tabList.setSelected(tabId)
        // this.tabList.setSelected(tabId)
        this.update()
    }

    clickTab(id) {
        this.tabList.setSelected(id)
        this.update()
    }

    closeTab(id) {
        const selectedId = this.tabList.getSelected()
        let selectedIndex = this.tabList.getIndex(selectedId)

        if (!id || selectedIndex === this.tabList.getIndex(id)) {
            this.tabList.destroy(selectedId)
            if (selectedIndex >= this.tabList.count()) {
                selectedIndex = this.tabList.count() - 1;
            }
            if (selectedIndex >= 0) {
                this.tabList.setSelected(this.tabList.getAtIndex(selectedIndex).id)
            }
        } else {
            this.tabList.destroy(id)
        }
        if (this.tabList.count() <= 0) {
            ipcRenderer.send('closeWindow')
        }
        this.update()
    }

    update() {
        this.setState({
            update: !this.state.update
        })
    }

    render() {
        return (
            <>
                <div id="tab-bar" className="windowDragHandle">
                    <Tabs tabList={this.tabList} clickTab={this.clickTab} closeTab={this.closeTab}
                    />
                    <div id="tab-btns">
                        <i className="material-icons">menu</i>
                        <i id="add-tab-button" className="material-icons"
                           onClick={this.openTab.bind(null, null)}>add</i>
                    </div>
                </div>
                <NavBar canGoBack={this.state.canGoBack} canGoForward={this.state.canGoForward}
                        goBackOrForward={this.goBackOrForward}
                        tabList={this.tabList}/>
            </>
        );
    }
}

const header = document.querySelector('#header');
ReactDOM.render(<Header/>, header);