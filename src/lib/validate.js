const geojsonhint = require('@mapbox/geojsonhint');

module.exports = function (callback) {
  return function (editor, changeObj) {
    const err = geojsonhint.hint(editor.getValue());
    editor.clearGutter('error');

    // check err for objects that don't have `level` properties
    // if any exist, reject the geojson
    const rejectableErrors = err.filter(
      (d) => !Object.prototype.hasOwnProperty.call(d, 'level')
    );

    if (err instanceof Error) {
      handleError(err.message);
      return callback({
        class: 'icon-circle-blank',
        title: 'invalid JSON',
        message: 'invalid JSON'
      });
    } else if (rejectableErrors.length) {
      handleErrors(err);
      return callback({
        class: 'icon-circle-blank',
        title: 'invalid GeoJSON',
        message: 'invalid GeoJSON'
      });
    } else {
      // err should only include warnings at this point
      // accept the geojson as valid but show the warnings
      handleErrors(err);

      const zoom =
        changeObj.from.ch === 0 &&
        changeObj.from.line === 0 &&
        changeObj.origin === 'paste';

      const gj = JSON.parse(editor.getValue());

      try {
        return callback(null, gj, zoom);
      } catch (e) {
        return callback({
          class: 'icon-circle-blank',
          title: 'invalid GeoJSON',
          message: 'invalid GeoJSON'
        });
      }
    }

    function handleError(msg) {
      const match = msg.match(/line (\d+)/);
      if (match && match[1]) {
        editor.clearGutter('error');
        editor.setGutterMarker(
          parseInt(match[1], 10) - 1,
          'error',
          makeMarker(msg)
        );
      }
    }

    function handleErrors(errors) {
      editor.clearGutter('error');
      errors.forEach((e) => {
        editor.setGutterMarker(e.line, 'error', makeMarker(e.message, e.level));
      });
    }

    function makeMarker(msg, level) {
      let className = 'error-marker';
      if (level === 'message') {
        className += ' warning';
      }

      return d3
        .select(document.createElement('div'))
        .attr('class', className)
        .attr('message', msg)
        .node();
    }
  };
};
