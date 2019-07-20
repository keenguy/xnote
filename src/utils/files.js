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
function walkDirSync(dirPath, projectDir) {
    let res = {}
    if (!fs.statSync(dirPath).isDirectory()) {
        return res
    }
    res.path = dirPath
    res.name = path.basename(dirPath)
    res.files = {}

    // try to load _config.yml (note that projects may nest)
    try {
        const config = yaml.safeLoad(fs.readFileSync(path.join(dirPath, '_config.yml'), 'utf8'))
        res.config = config
        res.projectDir = dirPath
    } catch (e) {
        res.projectDir = projectDir
    }

    fs.readdirSync(dirPath).forEach(function (fileName) {
        const nextPath = path.join(dirPath, fileName);
        if (fs.statSync(nextPath).isDirectory()) {
            const tmp = walkDirSync(nextPath, res.projectDir);
            res.files[fileName] = tmp;
        } else {
            res.files[fileName] = {path: nextPath, name: fileName, parent: res, projectDir: res.projectDir};
        }
    });

    return res
}


/*
   dir: a dir object
   relPath: path relative to dir.path
 */
function getSubDir(dir, relPath) {
    const names = relPath.split(path.sep)
    let subDir = dir;
    if (names.length > 0 && names[0].length > 0 && names[0][0] != '.') {
        for (const name of names) {
            if (subDir && subDir.files) {
                subDir = subDir.files[name]
            } else {
                return null
            }
        }
    }
    return subDir
}

module.exports = {walkDirSync, getSubDir}