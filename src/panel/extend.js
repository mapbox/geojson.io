var fs = require('fs');

module.exports = function(context) {

    function render(selection) {

        CodeMirror.keyMap.tabSpace = {
            Tab: function(cm) {
                var spaces = new Array(cm.getOption('indentUnit') + 1).join(' ');
                cm.replaceSelection(spaces, 'end', '+input');
            },
            'Ctrl-S': saveAction,
            'Cmd-S': saveAction,
            fallthrough: ['default']
        };

        var textarea = selection
            .html('')
            .append('div')
            .attr('class', 'half-cm')
            .append('textarea');

        var pane = selection
            .append('div')
            .attr('class', 'overlay');

        var editor = CodeMirror.fromTextArea(textarea.node(), {
            mode: 'text/javascript',
            matchBrackets: true,
            tabSize: 2,
            gutters: ['error'],
            theme: 'eclipse',
            autofocus: (window === window.top),
            keyMap: 'tabSpace',
            lineNumbers: true
        });

        context.dispatch.on('change.json', function(event) {
        });

        function saveAction() {
            var val = editor.getValue();
            console.log(val);
            eval(val);
            pane.call(_plugin(context));
            return false;
        }

        editor.on('change', function() {
        });

        editor.setValue(fs.readFileSync('data/null.js'));
    }

    render.off = function() {
    };

    return render;
};
