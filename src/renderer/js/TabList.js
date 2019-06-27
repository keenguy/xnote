const {ipcRenderer} = window.require("electron")

class TabList {
    constructor(tabs) {
        this.tabs = tabs || []
        // this.parentTaskList = parentTaskList
    }

    add(tab = {}, index) {
        var tabId = String(tab.id || Math.round(Math.random() * 100000000000000000)) // you can pass an id that will be used, or a random one will be generated.

        var newTab = {
            url: tab.url || '',
            title: tab.title || '',
            id: tabId,         // same as corresponding view's id (if view exists)
            lastActivity: tab.lastActivity || Date.now(),
            secure: tab.secure,
            private: tab.private || false,
            readerable: tab.readerable || false,
            backgroundColor: tab.backgroundColor,
            foregroundColor: tab.foregroundColor,
            selected: tab.selected || false
        }

        if (index) {
            this.tabs.splice(index, 0, newTab)
        } else {
            this.tabs.push(newTab)
        }

        // this.parentTaskList.emit('tab-added', tabId)

        return tabId
    }

    update(id, data) {
        if (!this.has(id)) {
            throw new ReferenceError('Attempted to update a tab that does not exist.')
        }
        const index = this.getIndex(id)

        for (var key in data) {
            if (data[key] === undefined) {
                throw new ReferenceError('Key ' + key + ' is undefined.')
            }
            this.tabs[index][key] = data[key]
            // this.parentTaskList.emit('tab-updated', id, key)
        }
    }

    destroy(id) {
        const index = this.getIndex(id)
        if (index < 0) return false

        // tasks.getTaskContainingTab(id).tabHistory.push(this.tabs[index])
        this.tabs.splice(index, 1)

        // this.parentTaskList.emit('tab-destroyed', id)

        return index
    }

    destroyAll() {
        // this = [] doesn't work, so set the length of the array to 0 to remove all of the itemss
        this.tabs.length = 0
    }

    get(id) {
        if (!id) { // no id provided, return an array of all tabs
            // it is important to deep-copy the tab objects when returning them. Otherwise, the original tab objects get modified when the returned tabs are modified (such as when processing a url).
            var tabsToReturn = []
            for (var i = 0; i < this.tabs.length; i++) {
                tabsToReturn.push(JSON.parse(JSON.stringify(this.tabs[i])))
            }
            return tabsToReturn
        }
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].id === id) {
                return JSON.parse(JSON.stringify(this.tabs[i]))
            }
        }
        return undefined
    }

    has(id) {
        return this.getIndex(id) > -1
    }

    getIndex(id) {
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].id === id) {
                return i
            }
        }
        return -1
    }

    getURLOfSelected() {
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].selected) {
                return this.tabs[i].url
            }
        }
        return "Unknown URL"
    }

    getIndexOfSelected() {
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].selected) {
                return i
            }
        }
        return -1
    }

    getSelected() {
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].selected) {
                return this.tabs[i].id
            }
        }
        return null
    }

    getAtIndex(index) {
        return this.tabs[index] || undefined
    }
    getIdFromURL(url){
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].url == url) {
                return this.tabs[i].id
            }
        }
        return null
    }
    setSelected(id) {
        if (!this.has(id)) {
            throw new ReferenceError('Attempted to select a tab that does not exist.')
        }
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].id === id) {
                this.tabs[i].selected = true
                this.tabs[i].lastActivity = Date.now()
            } else if (this.tabs[i].selected) {
                this.tabs[i].selected = false
                this.tabs[i].lastActivity = Date.now()
            }
        }
        console.log("TabList setView: ", {id: id})
        ipcRenderer.send('setView', {id: id, focus: true})
        // ipcRenderer.send('setView', {id:id, focus: true})

        // this.parentTaskList.emit('tab-selected', id)
    }

    count() {
        return this.tabs.length
    }

    isEmpty() {
        if (!this.tabs || this.tabs.length === 0) {
            return true
        }

        if (this.tabs.length === 1 && !this.tabs[0].url) {
            return true
        }

        return false
    }

    forEach(fun) {
        return this.tabs.forEach(fun)
    }

    map(fun) {
        return this.tabs.map(fun)
    }

    splice(...args) {
        return this.tabs.splice.apply(this.tabs, args)
    }

    getStringifyableState() {
        return this.tabs
    }
}

module.exports = TabList
