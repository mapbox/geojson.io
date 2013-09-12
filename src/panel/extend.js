var fs = require('fs');
    browserPlayground = require('browser-module-playground');

module.exports = function(context) {

    function render(selection) {

        var playground = new browserPlayground();

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
            .attr('class', 'overlay pad1');

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

        function saveAction() {
            var val = editor.getValue();
            playground.bundle(val).on('bundleEnd', function(source) {
                if (source) eval(source);
                pane.call(plugin(context));
            });
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
