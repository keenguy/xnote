import React from 'react'


const fs = window.require('fs')
const path = window.require('path')

const {walkDirSync} = require('../utils/dir')

class FileItem extends React.Component {
    render() {
        const file = this.props.file;
        const name = file.name || file.path;
        let date = null
        if (file.date) {
            date = <span className='date'>{file.date.toLocaleString()}</span>
        }
        let res
        // if (this.props.openFile) {
        res = (
            <li className="file" onClick={(e) => this.props.openFile(file.path)}>
                <span>{name}</span> {date}
            </li>)
        // } else {
        //     const relPath = path.relative(this.props.basePath, file.path)
        //     res = (
        //         <li className="file">
        //             <a href={`file://${file.path}`}>{name}</a> {date}
        //         </li>)
        // }
        return res
    }
}

class DirList extends React.Component {
    genList(dirPath, files) {
        const items = files.map((entry) => {
            if (entry.files) {
                const nested = this.genList(entry.path, entry.files);
                if (nested) {
                    return <li key={entry.path}> {nested} </li>;
                } else {
                    return null;
                }
            } else {
                if (!this.props.filter || entry.path.indexOf(this.props.filter) > -1) {
                    return <FileItem openFile={this.props.openFile} key={entry.path} file={entry}
                                     basePath={this.props.basePath}/>
                } else {
                    return null
                }
            }
        });
        if (!items.some((item) => {
            return item
        })) return null;

        let header = null;
        if (dirPath) {
            header = <span><i className="fa fa-folder-open"></i> {dirPath}</span>
        }
        return (
            <>
                {header}
                <ul>{items}</ul>
            </>
        );
    }

    render() {
        let dirPath = this.props.dirPath;
        const files = walkDirSync(dirPath, this.props.exts);
        return this.genList(null, files);
    }
}

class EditPrj extends React.Component {
    render() {
        const basePath = this.props.basePath;
        if (!this.props.file.path) {
            return null;
        }
        const dirPath = path.dirname(this.props.file.path)
        const dir = path.relative(basePath, dirPath)
        return (
            <div className='toc' style={{display: this.props.show ? 'flex' : 'none'}}>
                <div>Project:{dir}</div>
                <DirList openFile={this.props.openFile} dirPath={dirPath}/>
            </div>
        );
    }
}


class EditTOC extends React.Component {

    render() {
        // console.log("toc rendering", this.props.value.length)
        const headers = parseHeaders(this.props.file.content);
        if (headers.length <= 0) {
            return null;
        }

        return <div className='toc'
                    style={{display: this.props.show ? 'flex' : 'none'}}>{elementFromHeaders(headers, 0, headers.length, 0, this.props.jumpTo)}</div>
    }
}


class Info extends React.Component {
    render() {
        const info = this.props.info;
        let level = info.level || 0;
        let class_name = ['success', 'warning', 'error']
        return <label className={class_name[level]}>{info.content}</label>
    }
}


// now for extracting toc
function parseHeaders(text) {
    let lineNo = 0, pos = 0;

    let headers = []

    function jumpTonextline() {
        while (pos < text.length && text[pos] !== '\n') {
            pos++;
        }
        lineNo++;
        pos++;
    }

    for (; pos < text.length;) {
        //at line begining
        if (text[pos] !== '#') {
            jumpTonextline();
            continue;
        }
        let oldPos = pos;
        while (pos < text.length && text[pos] === '#') {
            pos++;
        }
        let level = pos - oldPos;
        if (pos >= text.length - 1 || text[pos] !== ' ' || level > 6) {
            jumpTonextline();
            continue;
        }
        oldPos = pos + 1;
        jumpTonextline()
        headers.push({
            level: level,
            text: text.slice(oldPos, pos),
            lineNo: lineNo - 1
        })
    }
    return headers;
}

function elementFromHeaders(headers, begin, end, level, jumpTo) {
    if (begin < 0 || end > headers.length || begin >= end) {
        return null;
    }
    let next = begin + 1;
    while (next < end && headers[next].level > level) next++;
    if (level < headers[begin].level) {
        return (
            <React.Fragment>
                <ul>
                    {elementFromHeaders(headers, begin, next, level + 1, jumpTo)}
                </ul>
                {elementFromHeaders(headers, next, end, level, jumpTo)}
            </React.Fragment>
        );
    } else if (level === headers[begin].level) {
        const h = headers[begin];
        return (
            <React.Fragment>
                <li className='toc-item' onClick={() => jumpTo(h.lineNo)}>{h.text}
                    {elementFromHeaders(headers, begin + 1, next, level, jumpTo)}
                </li>
                {elementFromHeaders(headers, next, end, level, jumpTo)}
            </React.Fragment>
        );
    }
}

export {EditTOC, EditPrj, Info, DirList, FileItem}