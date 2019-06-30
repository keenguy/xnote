const fs = require('fs')
const path = require('path')


function walkDirSync(dir, exts) {
    if (!fs.statSync(dir).isDirectory()) {
        return {}
    }

    let files = fs.readdirSync(dir);
    let filelist = [];
    files.forEach(function (file) {
        let next = path.join(dir, file);
        if (fs.statSync(next).isDirectory()) {
            const tmp = walkDirSync(next, exts);
            if (tmp.length > 0) {
                filelist.push({name: file, path: next, files: tmp});
            }
        } else {
            const ext = path.extname(file)
            if (!exts || (Array.isArray(exts) && exts.includes(ext)) || exts === ext ) {
                filelist.push({path: next, name: file});
            }
        }
    });
    return filelist;
}

module.exports = {walkDirSync}