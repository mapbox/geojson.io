module.exports = detectIndentationStyle;

function detectIndentationStyle(f) {
    var lines = f.split('\n');
    if (lines.length < 2) return 4;
    var indent = lines[1].match(/^(\s*)/);
    if (!indent || !indent.length) return 4;
    if (indent[0][0] == '\t') {
        return '\t';
    } else {
        return indent[0].length;
    }
}
