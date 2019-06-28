const hljs = require('highlight.js')
const Markdown = require('markdown-it');

Markdown.prototype.render = async function (src, env) {
    env = env || {};
    const tokens = this.parse(src, env);
    if(this.output && this.output.promises){
        return Promise.all(this.output.promises).then(()=>{
            return this.renderer.render(tokens, this.options, env);
        })
    }
};

const md = new Markdown({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value;
            } catch (__) {}
        }

        return ''; // use external default escaping
    },
    breaks:true
});



md.output = {tocHtml:'', promises: []};


md.use(require('markdown-it-task-lists'))
    .use(require('markdown-it-footnote'))
    .use( require("./markdown-it-anchor"))
    .use(require('markdown-it-attrs'))
    .use(require('./markdown-toc'),{output: md.output})
    // .use(require('./markdown-mathjax.js'), {output: md.output})
    .use(require('./markdown-it-container'), 'theorem',{
        validate: function(params) {
            return true
        },

        render: function (tokens, idx) {
            var type = tokens[idx].info.trim();

            if (tokens[idx].nesting === 1) {
                // opening tag
                return `<div class="${type}">`;

            } else {
                // closing tag
                return '</div>\n';
            }
        }
    })




function addLineNumber(state) {
    state.tokens.map((t) => {
        if (t.block && t.map && t.type !== 'inline') {
            t.attrPush(['data-source-line', t.map[0]])
            t.attrPush(['onmousedown', `syncToEdit(event, this.getAttribute('data-source-line'))`])
        }
    })
}

// custom backticks

md.core.ruler.push('addLineNumber', addLineNumber)
module.exports = md;