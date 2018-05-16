import React from "react";
import CodeMirror from "codemirror";
import jsMode from "codemirror/mode/javascript/javascript";
import validate from "../lib/validate";
import zoomextent from "../lib/zoomextent";
import saver from "../ui/saver.js";

CodeMirror.keyMap.tabSpace = {
  Tab: function(cm) {
    var spaces = new Array(cm.getOption("indentUnit") + 1).join(" ");
    cm.replaceSelection(spaces, "end", "+input");
  },
  // "Ctrl-S": saveAction,
  // "Cmd-S": saveAction,
  fallthrough: ["default"]
};

export class Code extends React.Component {
  render(selection) {
    var textarea = selection.html("").append("textarea");

    var editor = CodeMirror.fromTextArea(textarea.node(), {
      mode: "application/json",
      matchBrackets: true,
      tabSize: 2,
      gutters: ["error"],
      theme: "eclipse",
      autofocus: window === window.top,
      keyMap: "tabSpace",
      lineNumbers: true
    });

    editor.on("change", validate(changeValidated));

    function changeValidated(err, data, zoom) {
      if (!err) {
        context.data.set({ map: data }, "json");
        if (zoom) zoomextent(context);
      }
    }

    context.dispatch.on("change.json", function(event) {
      if (event.source !== "json") {
        var scrollInfo = editor.getScrollInfo();
        editor.setValue(JSON.stringify(context.data.get("map"), null, 2));
        editor.scrollTo(scrollInfo.left, scrollInfo.top);
      }
    });

    editor.setValue(JSON.stringify(context.data.get("map"), null, 2));
  }
}
