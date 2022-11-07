var _ = require('lodash');
var { createPopper } = require('@popperjs/core');

const CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/edit/matchbrackets');
require('codemirror/mode/javascript/javascript');

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

    // copy button tooltip
    const tooltip = selection
      .append('div')
      .attr('id', 'tooltip')
      .attr('class', 'opacity-0 text-white font-medium text-xs rounded text-left py-1 px-2 bg-mb-gray-dark transition-opacity duration-100')
      .attr('role', 'tooltip')
      .text('Copied!');

    // tooltip arrow
    const arrow = tooltip
      .append('div')
      .attr('id', 'arrow')
      .attr('class', '-right-1 top-0 translate-y-2 absolute w-2 h-2 bg-transparent before:opacity-0 before:transition-opacity before:duration-100 group-hover:before:opacity-100 before:absolute before:w-2 before:h-2 before:rotate-45 before:bg-mb-gray-dark')
      .attr('data-popper-arrow', '');

    // adds a copy button
    var buttonContainer = selection
      .append('div')
      .attr('class', 'mapboxgl-ctrl mapboxgl-ctrl-group absolute right-5 top-5 opacity-0 group-hover:opacity-100 transition-opacity duration-100');
      
    var button = 
      buttonContainer.append('button')
        .attr('id', 'copy-button')
        .attr('title', 'Copy')
        .on('click', () => {
          // copy to clipboard
          navigator.clipboard.writeText(editor.getValue());

          // set the button to a green checkmark
          buttonIcon.classed('fa-copy', false).attr('class', 'fa-solid fa-check text-green-600');
          // show tooltip
          tooltip.classed('group-hover:opacity-100', true);
          setTimeout(() => {
            buttonIcon.attr('class', 'fa-solid fa-copy text-gray-500');
            // hide tooltip
            tooltip.classed('group-hover:opacity-100', false);
          }, 3000);
        });


      
    const copyButtonEl = document.querySelector('#copy-button');
    const tooltipEl = document.querySelector('#tooltip');
    
    createPopper(copyButtonEl, tooltipEl, {
      placement: 'left',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    });

    var buttonIcon =  button
      .append('span')
      .attr('class', 'fa-solid fa-copy text-gray-500');

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

    // blur the editor so map keybindings will work on initial load
    editor.display.input.blur();

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
        // don't set data unless it has actually changed
        if (!_.isEqual(data, context.data.get('map'))) {
          context.data.set({map: data}, 'json');
          if (zoom) zoomextent(context);
        }
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
