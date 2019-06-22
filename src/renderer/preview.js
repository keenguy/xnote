import React from 'react'
import ReactDOM from 'react-dom'
import "material-design-icons/iconfont/material-icons.css"
import '../../assets/style/preview.css'
import TabList from './tabs/TabList'




const {ipcRenderer, webContents} = window.require('electron')

class Tabs extends React.Component {
    render() {
        const tabList = this.props.tabList;
        const selected = tabList.getIndexOfSelected();
        const tabs = this.props.tabList.map((tab, idx) => {
            const title = tab.title || "New Tab"
            const  wrapperClasses = `tab-item-wrapper${tab.selected ? ' active' : ''}`
            let itemClasses = `tab-item${tab.selected ? ' active' : ''}`
            if(idx === selected || idx === selected - 1){
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

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.viewsMap = {}
        this.nextID = 0;

        this.tabList = new TabList()

        this.state = {
            update: true
        }
        this.clickTab = this.clickTab.bind(this)
        this.closeTab = this.closeTab.bind(this)
        this.addTab = this.addTab.bind(this)
        this.update = this.update.bind(this)
        this.goBack = this.goBack.bind(this)
    }

    componentDidMount() {
        ipcRenderer.on('closeTab', ()=>{
            console.log("closeTab event")
            this.closeTab()
        })

        ipcRenderer.on('newTab', (event, data)=>{
            console.log("received newTab", data)
            this.addTab(data)
        })
        this.update();
    }

    goBack(){
        const viewId = this.tabList.getViewIdOfSelected()
        ipcRenderer.send('goBack', viewId)
    }

    addTab(opt) {
        opt = opt || {}
        const id = this.tabList.add({
            viewId: opt.viewId || "",
            url: opt.url || "",
            title: opt.title || "New Tab",
            selected: false
        }, this.tabList.count())
        this.tabList.setSelected(id)
        this.update()
    }
    clickTab(id){
        this.tabList.setSelected(id)
        this.update()
    }

    closeTab(id) {
        let selected = this.tabList.getIndexOfSelected()
        if(!id || selected === this.tabList.getIndex(id)){
            this.tabList.destroyIndex(selected)
            if (selected >= this.tabList.count()) {
                selected = this.tabList.count() - 1;
            }
            if (selected >= 0) {
                this.tabList.setSelected(this.tabList.getAtIndex(selected).id)
            }
        }else {
            this.tabList.destroy(id)
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
                <div id="tab-bar">
                    <Tabs tabList={this.tabList} clickTab={this.clickTab} closeTab={this.closeTab}/>
                    <div id="tab-btns">
                        <i className="material-icons">menu</i>
                        <i id="add-tab-button" className="material-icons" onClick={this.addTab}>add</i>
                    </div>
                </div>
                <div id="nav-bar">
                    <div>
                        <i className="material-icons" onClick={this.goBack}>arrow_back</i>
                        <i className="material-icons">arrow_forward</i>
                    </div>

                </div>
            </>
        );
    }
}

const header = document.querySelector('#header');
ReactDOM.render(<Header/>, header);