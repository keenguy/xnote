const md = require('../lib/markdown.js');
const Handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')


function converter() {
    const templFile = path.join(__dirname, '../pages/preview.html')
    const htmlTempl = fs.readFileSync(templFile, {encoding: 'utf8'})
    templ = Handlebars.compile(htmlTempl)

    function convert(src, opt) {
        const {title, filePath} = src
        let content = src.content
        if(!content) {
            content = fs.readFileSync(filePath, {encoding: 'utf8'})
        }
        opt.content = md.render(content)
        opt.toc = md.output.tocHtml
        opt.title = title
        html = templ(opt)

        let outPath = opt.outPath
        if(!outPath) {
            const pos = filePath.lastIndexOf('.')
            outPath = filePath.substr(0, pos) + '.html'
        }
        fs.writeFileSync(outPath, html, {encoding: 'utf8'})
    }

    return convert
}


module.exports = converter