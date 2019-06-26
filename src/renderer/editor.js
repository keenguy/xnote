import React from 'react'
import ReactDOM from 'react-dom'


const {ipcRenderer} = window.require('electron');

class Header extends React.Component{
    componentDidMount() {
        document.addEventListener('click', function (event) {
            // console.log(event.target.href)
            let url = event.target.getAttribute('href')
            if (event.target.tagName === 'A') {
                event.preventDefault()
                ipcRenderer.send('preview', {url: event.target.getAttribute('href'), title: event.target.text})
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