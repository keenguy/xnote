const {ipcRenderer} = require('electron')

document.title = "Preview";


ipcRenderer.on('sync', (event, line) => {
    console.log('sync: ', line)
    const res = document.querySelectorAll('[data-source-line]');
    for (let el of res) {
        const lineNo = parseInt(el.getAttribute('data-source-line'), 10)
        if (lineNo >= line) {
            console.log("jumpTo: ", lineNo)
            el.scrollIntoView({block:'center', inline:'start'});
            el.classList.add('sync-mark');
            setTimeout(()=>{el.classList.remove('sync-mark')}, 1200)
            break;
        }
    }
})

function syncToEdit(event, line) {
    if (event.ctrlKey) {
        ipcRenderer.send('sync', {toWin: 0, line: line})
    }
}