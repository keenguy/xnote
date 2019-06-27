import React from 'react'
import ReactDOM from 'react-dom'

import '../../assets/style/highlight/xcode.css'
import '../../assets/style/github-markdown.css'
import '../../assets/style/preview.css'
import '../../assets/style/mathjax.css'

const {remote, ipcRenderer} = window.require('electron')

class Preview extends React.Component {
    componentDidMount() {
        console.log("preview did mount")
        const content_div = document.querySelector('#content')
        const toc_div = document.querySelector('#toc')
        ipcRenderer.on('update', (event, data) => {
            console.log("update received")
            if (data.title){
                document.title = data.title
            }
            content_div.innerHTML = data.content
            toc_div.innerHTML = data.toc
        });

        ipcRenderer.on('find', ()=>{
            let findInPage = new FindInPage(remote.getCurrentWebContents())
            findInPage.openFindWindow()
        })
    }

    render() {
        return (
            <>
                <div className='main'>
                    <article id='content' className="markdown-body w3-padding-64 w3-container">
                    </article>
                </div>
                <aside id="toc"></aside>
            </>
        );

    }
}


const preview = document.getElementById('preview');
ReactDOM.render(<Preview/>, preview);