import React from "react";
import CodeMirror from "codemirror";
import jsMode from "codemirror/mode/javascript/javascript";
import validate from "../lib/validate";
import zoomextent from "../lib/zoomextent";
import saver from "../ui/saver.js";

export default class Code extends React.Component {
  constructor(props) {
    super(props);
    this.codeMirrorContainer = React.createRef();
  }
  componentDidMount() {
    const { geojson } = this.props;
    const node = this.codeMirrorContainer.current;

    CodeMirror.keyMap.tabSpace = {
      Tab: cm => {
        var spaces = new Array(cm.getOption("indentUnit") + 1).join(" ");
        cm.replaceSelection(spaces, "end", "+input");
      },
      // "Ctrl-S": saveAction,
      // "Cmd-S": saveAction,
      fallthrough: ["default"]
    };
    const editor = new CodeMirror(node, {
      mode: "application/json",
      matchBrackets: true,
      tabSize: 2,
      gutters: ["error"],
      autofocus: window === window.top,
      keyMap: "tabSpace",
      lineNumbers: true,
      theme: "neat"
    });
    editor.setValue(JSON.stringify(geojson, null, 2));
    this.setState({
      editor
    });
  }
  componentDidUpdate() {
    const { geojson } = this.props;
    const { editor } = this.state;
    editor.setValue(JSON.stringify(geojson, null, 2));
  }
  render() {
    return <div className="flex-auto flex" ref={this.codeMirrorContainer} />;
  }
}
