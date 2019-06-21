import React from 'react'
import ReactDOM from 'react-dom'


const {ipcRenderer} = window.require('electron');

class Header extends React.Component{
    componentDidMount() {
        document.addEventListener('click', function (event) {
            if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
                event.preventDefault()
                ipcRenderer.send('preview', {path: event.target.getAttribute('href')})
            }
        })
    }

    back(){

    }
    render(){
        return (
            <div className='nav'>
                <i className="fa fa-arrow-left" aria-hidden="true" onClick={this.back}>back</i>
            </div>
        );
    }
}

const header = document.getElementById('header')
ReactDOM.render(<Header />, header)