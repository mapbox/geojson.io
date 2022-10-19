var validate = require('../lib/validate'),
  zoomextent = require('../lib/zoomextent'),
  saver = require('../ui/saver.js');

module.exports = function(context) {

  CodeMirror.keyMap.tabSpace = {
    Tab: function(cm) {
      var spaces = new Array(cm.getOption('indentUnit') + 1).join(' ');
      cm.replaceSelection(spaces, 'end', '+input');
    },
    'Ctrl-S': saveAction,
    'Cmd-S': saveAction,
    fallthrough: ['default']
  };

  function saveAction() {
    saver(context);
    return false;
  }

  function render(selection) {
    var textarea = selection
      .html('')
      .append('textarea');

    var editor = CodeMirror.fromTextArea(textarea.node(), {
      mode: {name: 'javascript', json: true},
      matchBrackets: true,
      tabSize: 2,
      gutters: ['error', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      theme: 'eclipse',
      autofocus: (window === window.top),
      keyMap: 'tabSpace',
      lineNumbers: true,
      foldGutter: true
    });

    editor.foldCode(CodeMirror.Pos(0, 0));
    editor.matchBrackets();

    editor.on('beforeChange', (cm, change) => {
      if(change.origin === 'paste') {
        try {
          const newText = JSON.stringify(JSON.parse(change.text[0]), null, 2);
          change.update(null, null, newText.split('\n'));
        } catch(e) {
          console.log('error pretty-printing pasted geojson', e);
        }
      }
    });

    editor.on('change', validate(changeValidated));

    function changeValidated(err, data, zoom) {
      if (!err) {
        context.data.set({map: data}, 'json');
        if (zoom) zoomextent(context);
      }
    }

    context.dispatch.on('change.json', function(event) {
      if (event.source !== 'json') {
        var scrollInfo = editor.getScrollInfo();
        editor.setValue(JSON.stringify(context.data.get('map'), null, 2));
        editor.scrollTo(scrollInfo.left, scrollInfo.top);
      }
    });

    editor.setValue(JSON.stringify(context.data.get('map'), null, 2));
  }

  render.off = function() {
    context.dispatch.on('change.json', null);
  };

  return render;
};
