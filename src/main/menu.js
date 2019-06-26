const {app, Menu, MenuItem} = require('electron')

const isMac = process.platform === 'darwin';

function getMenu(menuAction) {
    // let tool = new MenuItem({
    //     label: "Tool",
    //     submenu: []
    // })

    const template = [
        // { role: 'appMenu' }
        ...(process.platform === 'darwin' ? [{
            label: app.getName(),
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services'},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        }] : []),
        // { role: 'fileMenu' }
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save',
                    accelerator: 'Cmd+S',
                    click: ()=>{
                        menuAction('callEdit', {msg: 'save'});
                    }
                }
            ]
        },
        // { role: 'editMenu' }
        {
            label: 'Edit',
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {label: 'find',
                    click:()=>{
                        menuAction('findInPreview')
                    },
                    accelerator: 'Cmd+F'},
                ...(isMac ? [
                    {role: 'pasteAndMatchStyle'},
                    {role: 'delete'},
                    {role: 'selectAll'},
                    {type: 'separator'},
                    {
                        label: 'Speech',
                        submenu: [
                            {role: 'startspeaking'},
                            {role: 'stopspeaking'}
                        ]
                    }
                ] : [
                    {role: 'delete'},
                    {type: 'separator'},
                    {role: 'selectAll'}
                ])
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                {role: 'reload'},
                {role: 'forcereload'},
                {role: 'toggledevtools'},
                {type: 'separator'},
                {role: 'resetzoom'},
                {role: 'zoomin'},
                {role: 'zoomout'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                {role: 'minimize'},
                {role: 'zoom'},
                ...(isMac ? [
                    {type: 'separator'},
                    {role: 'front'},
                    {type: 'separator'}
                ] : [
                ]),
                {
                    label: 'close tab',
                    accelerator: 'Cmd+W',
                    click: ()=>{
                        menuAction('closeTab')
                    }
                },
                {
                    label: 'Switch to Browser',
                    accelerator: 'Cmd+Option+Right',
                    click: () => {
                        menuAction('toBrowser')
                    }
                },
                {
                    label: 'Switch to Editor',
                    accelerator: 'Cmd+Option+Left',
                    click: () => {
                        menuAction('toEditor');
                    }
                },
                {
                    label: 'preview',
                    accelerator: 'Cmd+Option+C',
                    click: () => {
                        menuAction('callEdit', {msg:'preview'});
                    }
                }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click() {
                        require('electron').shell.openExternalSync('https://electronjs.org')
                    }
                }
            ]
        }
    ]

    return Menu.buildFromTemplate(template)
}

module.exports = getMenu;