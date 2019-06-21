import React from 'react'
import ReactDOM from 'react-dom'
import '../pages/preview.css'
import TabList from './tabs/TabList'


const {ipcRenderer, webContents} = window.require('electron')

class TabBar extends React.Component {
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
                        <i className="fa fa-times" onClick={this.props.closeTab.bind(null, tab.id)}/>
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
    }

    componentDidMount() {
        for (let i = 0; i < 5; i++) {
            this.addTab()
        }
        this.update()
    }

    addTab() {
        const id = this.tabList.add({
            url: "",
            title: "New Tab",
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
        const selected = this.tabList.getIndexOfSelected()
        let index = this.tabList.destroy(id)
        if (index === selected) {
            if (index >= this.tabList.count()) {
                index = this.tabList.count() - 1;
            }
            if (index >= 0) {
                this.tabList.setSelected(this.tabList.getAtIndex(index).id)
            }
        }
        this.update()
    }

    update() {
        this.setState({
            update: !this.state.update
        })
    }

    addView(title) {
        title = title || "New Tab";
        const id = this.nextID++;
        this.viewsMap[id] = title;
        return id;
    }

    render() {
        return (
            <>
                <div id="tab-bar">
                    <TabBar tabList={this.tabList} clickTab={this.clickTab} closeTab={this.closeTab}/>
                    <div className="tab-btn-wrapper">
                        < i className="fa fa-bars navbar-action-button invisible tab-btn"> </i>
                        <i id="add-tab-button" className="fa fa-plus tab-btn" onClick={this.addTab}></i>
                    </div>
                </div>
                <div id="nav-bar">
                    <div>
                        <i className="fa fa-arrow-left"></i>
                        <i className="fa fa-arrow-right"></i>
                    </div>

                </div>
            </>
        );
    }
}

const header = document.querySelector('#header');
ReactDOM.render(<Header/>, header);