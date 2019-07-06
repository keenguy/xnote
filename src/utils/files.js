const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')


/* entry {
       path:
       name:
       files:
       config:
   }
 */
function walkDirSync(dirPath) {
    let res = {}
    if (!fs.statSync(dirPath).isDirectory()) {
        return res
    }
    res.path = dirPath
    res.name = path.basename(dirPath)
    res.files = {}
    fs.readdirSync(dirPath).forEach(function (fileName) {
        const nextPath = path.join(dirPath, fileName);
        if (fs.statSync(nextPath).isDirectory()) {
            const tmp = walkDirSync(nextPath);
            res.files[fileName] = tmp;
        } else if (fileName === "_config.yml") {
            res.config = yaml.safeLoad(fs.readFileSync(path.join(dirPath, fileName)))
        } else {
            res.files[fileName] = {path: nextPath, name: fileName, parent: res};
        }
    });

    return res
}


/*
   dir: a dir object
   relPath: path relative to dir.path
 */
function getSubDir(dir, relPath){
    const names = relPath.split(path.sep)
    console.log(names)
    let subDir = dir;
    if(names.length > 0 && names[0].length > 0 && names[0][0] != '.') {
        for(const name of names){
            if(subDir && subDir.files) {
                subDir = subDir.files[name]
            }else{
                return null
            }
        }
    }
    return subDir
}

module.exports = {walkDirSync, getSubDir}