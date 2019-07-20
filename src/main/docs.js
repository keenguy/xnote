
const {walkDirSync, getSubDir} = require('../utils/files')



function getDocsFun(basePath){
    let docs = null
    const getDocs = function(override){
        if (!override && docs){
            return docs
        }else {
            return docs = walkDirSync(basePath)
        }
    }
    return getDocs
}


module.exports = {
    getDocsFun,
    getSubDir
}