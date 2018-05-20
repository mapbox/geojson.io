import React from "react";
import CodeMirror from "codemirror";
import jsMode from "codemirror/mode/javascript/javascript";
import zoomextent from "../lib/zoomextent";
import { hint } from "@mapbox/geojsonhint";
import saver from "../ui/saver.js";

export default class Code extends React.Component {
  state = {
    error: undefined
  };
  constructor(props) {
    super(props);
    this.codeMirrorContainer = React.createRef();
  }
  maybeChange = (editor, changeObj) => {
    const { setGeojson } = this.props;
    const val = editor.getValue();
    const err = hint(val);
    editor.clearGutter("error");

    if (err instanceof Error) {
      this.handleJsonError(editor, err.message);
    } else if (err.length) {
      this.handleGeoJSONError(editor, err);
    } else {
      const zoom =
        changeObj.from.ch === 0 &&
        changeObj.from.line === 0 &&
        changeObj.origin == "paste";
      try {
        const gj = JSON.parse(val);
        return setGeojson(gj);
      } catch (e) {
        console.error(e);
        this.setState({
          error: {
            class: "icon-circle-blank",
            title: "invalid GeoJSON",
            message: "invalid GeoJSON"
          }
        });
      }
    }
  };
  handleGeoJSONError(editor, errors) {
    editor.clearGutter("error");
    errors.forEach(e => {
      editor.setGutterMarker(e.line, "error", this.makeMarker(e.message));
    });
    this.setState({
      error: {
        class: "icon-circle-blank",
        title: "invalid GeoJSON",
        message: "invalid GeoJSON"
      }
    });
  }
  handleJsonError(editor, msg) {
    var match = msg.match(/line (\d+)/);
    if (match && match[1]) {
      editor.clearGutter("error");
      editor.setGutterMarker(
        parseInt(match[1], 10) - 1,
        "error",
        this.makeMarker(msg)
      );
    }
    this.setState({
      error: {
        class: "icon-circle-blank",
        title: "invalid JSON",
        message: "invalid JSON"
      }
    });
  }
  makeMarker(msg) {
    const div = document.createElement("div");
    div.className = "error-marker";
    div.setAttribute("message", msg);
    return div;
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
    editor.on("change", this.maybeChange);
    this.setState({
      editor
    });
  }
  componentDidUpdate() {
    const { geojson } = this.props;
    const { editor } = this.state;
    editor.off("change", this.maybeChange);
    editor.setValue(JSON.stringify(geojson, null, 2));
    editor.on("change", this.maybeChange);
  }
  render() {
    return <div className="flex-auto flex" ref={this.codeMirrorContainer} />;
  }
}
