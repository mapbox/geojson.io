var validate = require('../validate');

CodeMirror.keyMap.tabSpace = {
    Tab: function(cm) {
        var spaces = new Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces, 'end', '+input');
    },
    fallthrough: ['default']
};

module.exports = function(context) {

    function render(selection) {
        var textarea = selection
            .html('')
            .append('textarea');

        var editor = CodeMirror.fromTextArea(textarea.node(), {
            mode: 'application/json',
            matchBrackets: true,
            tabSize: 2,
            gutters: ['error'],
            theme: 'eclipse',
            autofocus: (window === window.top),
            keyMap: 'tabSpace',
            lineNumbers: true
        });

        // shush the callback-back
        editor.on('change', validate(changeValidated));

        function changeValidated(err, data) {
            if (!err) context.data.set({map: data}, 'json');
        }

        context.dispatch.on('change.json', function(event) {
            if (event.source !== 'json') {
                editor.setValue(JSON.stringify(context.data.get('map'), null, 2));
            }
        });

        editor.setValue(JSON.stringify(context.data.get('map'), null, 2));
    }

    render.off = function() {
        context.dispatch.on('change.json', null);
    };

    return render;
};
