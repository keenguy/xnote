// a simple TeX-input example
const mjAPI = require("mathjax-node");
// const UUID = require('uuid/v1')
// const hash = require('object-hash');
mjAPI.config({
    displayMessages: false,    // determines whether Message.Set() calls are logged
    displayErrors:   true,     // determines whether error messages are shown on the console
    undefinedCharError: false, // determines whether "unknown characters" (i.e., no glyph in the configured fonts) are saved in the error array
    extensions: '',            // a convenience option to add MathJax extensions
    fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
    paths: {},                  // configures custom path variables (e.g., for third party extensions, cf. test/config-third-party-extensions.js)
    MathJax: { }               // standard MathJax configuration options, see https://docs.mathjax.org for more detail.
});
mjAPI.start();


class Math {
    constructor() {
        // this._cache = {};
        this.promises = [];
    }

    compile(token) {
        if(token.type !== 'math_block' && token.type !== 'math_inline') return;
        const text = token.content;
        if(!text) return;
        // if(this._cache.hasOwnProperty(id)) return;
        const format = token.type === 'math_block' ? 'TeX' : 'inline-TeX';
        let p = mjAPI.typeset({
            math: text,
            format: format, // or "inline-TeX", "MathML"
            svg: true,      // or svg:true, or html:true
        }).then((output,input)=>{
            // console.log('\n\n\n',text)
            // console.log("=>")
            // console.log(output.html)
            token.content = output.svg;
            // this._cache[id] = output.html;
        }).catch((errors)=>{
            console.log(errors)
        });
        this.promises.push(p);
    }
}

const math = new Math();
// Test if potential opening or closing delimieter
// Assumes that there is a "$" at state.src[pos]
function isValidDelim(state, pos) {
    var prevChar, nextChar,
        max = state.posMax,
        can_open = true,
        can_close = true;

    prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
    nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1;

    // Check non-whitespace conditions for opening and closing, and
    // check that closing delimeter isn't followed by a number
    if (prevChar === 0x20/* " " */ || prevChar === 0x09/* \t */ ||
        (nextChar >= 0x30/* "0" */ && nextChar <= 0x39/* "9" */)) {
        can_close = false;
    }
    if (nextChar === 0x20/* " " */ || nextChar === 0x09/* \t */) {
        can_open = false;
    }

    return {
        can_open: can_open,
        can_close: can_close
    };
}

function math_inline(state, silent) {
    var start, match, token, res, pos, esc_count;

    if (state.src[state.pos] !== "$") { return false; }

    res = isValidDelim(state, state.pos);
    if (!res.can_open) {
        if (!silent) { state.pending += "$"; }
        state.pos += 1;
        return true;
    }

    // First check for and bypass all properly escaped delimieters
    // This loop will assume that the first leading backtick can not
    // be the first character in state.src, which is known since
    // we have found an opening delimieter already.
    start = state.pos + 1;
    match = start;
    while ( (match = state.src.indexOf("$", match)) !== -1) {
        // Found potential $, look for escapes, pos will point to
        // first non escape when complete
        pos = match - 1;
        while (state.src[pos] === "\\") { pos -= 1; }

        // Even number of escapes, potential closing delimiter found
        if ( ((match - pos) % 2) == 1 ) { break; }
        match += 1;
    }

    // No closing delimter found.  Consume $ and continue.
    if (match === -1) {
        if (!silent) { state.pending += "$"; }
        state.pos = start;
        return true;
    }

    // Check if we have empty content, ie: $$.  Do not parse.
    if (match - start === 0) {
        if (!silent) { state.pending += "$$"; }
        state.pos = start + 1;
        return true;
    }

    // Check for valid closing delimiter
    res = isValidDelim(state, match);
    if (!res.can_close) {
        if (!silent) { state.pending += "$"; }
        state.pos = start;
        return true;
    }

    if (!silent) {
        token         = state.push('math_inline', 'inline_math', 0);
        token.markup  = "$";
        token.content = state.src.slice(start, match);
        math.compile(token)
    }

    state.pos = match + 1;
    return true;
}

function math_block(state, start, end, silent){
    var firstLine, lastLine, next, lastPos, found = false, token,
        pos = state.bMarks[start] + state.tShift[start],
        max = state.eMarks[start]

    if(pos + 2 > max){ return false; }
    if(state.src.slice(pos,pos+2)!=='$$'){ return false; }

    pos += 2;
    firstLine = state.src.slice(pos,max);

    if(silent){ return true; }
    if(firstLine.trim().slice(-2)==='$$'){
        // Single line expression
        firstLine = firstLine.trim().slice(0, -2);
        found = true;
    }

    for(next = start; !found; ){

        next++;

        if(next >= end){ break; }

        pos = state.bMarks[next]+state.tShift[next];
        max = state.eMarks[next];

        if(pos < max && state.tShift[next] < state.blkIndent){
            // non-empty line with negative indent should stop the list:
            break;
        }

        if(state.src.slice(pos,max).trim().slice(-2)==='$$'){
            lastPos = state.src.slice(0,max).lastIndexOf('$$');
            lastLine = state.src.slice(pos,lastPos);
            found = true;
        }

    }

    state.line = next + 1;

    token = state.push('math_block', 'math_block', 0);
    token.block = true;
    token.content = (firstLine && firstLine.trim() ? firstLine + '\n' : '')
        + state.getLines(start + 1, next, state.tShift[start], true)
        + (lastLine && lastLine.trim() ? lastLine : '');
    token.map = [ start, state.line ];
    token.markup = '$$';
    math.compile(token)
    return true;
}

module.exports = function math_plugin(md, options) {
    // Default options
    options = options || {};
    options.output.promises = math.promises;

    // set KaTeX as the renderer for markdown-it-simplemath
    // var katexInline = function(latex){
    //     options.displayMode = false;
    //     try{
    //         return katex.renderToString(latex, options);
    //     }
    //     catch(error){
    //         if(options.throwOnError){ console.log(error); }
    //         return latex;
    //     }
    // };

    var inlineRenderer = function(tokens, idx){
        return tokens[idx].content;
    };
    //
    // var katexBlock = function(latex){
    //     options.displayMode = true;
    //     try{
    //         return "<p>" + katex.renderToString(latex, options) + "</p>";
    //     }
    //     catch(error){
    //         if(options.throwOnError){ console.log(error); }
    //         return latex;
    //     }
    // }

    var blockRenderer = function(tokens, idx){
        return  tokens[idx].content + '\n';
    }

    md.inline.ruler.after('escape', 'math_inline', math_inline);
    md.block.ruler.after('blockquote', 'math_block', math_block, {
        alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
    });
    md.renderer.rules.math_inline = inlineRenderer;
    md.renderer.rules.math_block = blockRenderer;
};

