const {ipcRenderer} = window.require('electron')

// document.addEventListener('click', function (event) {
//     console.log("dom clicked")
//     if (event.target.tagName === 'A') {
//         event.preventDefault()
//         ipcRenderer.send('loadURL', {url: event.target.getAttribute('href')})
//     }
// })