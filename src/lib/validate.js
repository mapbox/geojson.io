var geojsonhint = require('geojsonhint');

module.exports = function(callback) {
    return function(editor, changeObj) {

        var err = geojsonhint.hint(editor.getValue());
        editor.clearGutter('error');

        if (err instanceof Error) {
            handleError(err.message);
            return callback({
                'class': 'icon-circle-blank',
                title: 'invalid JSON',
                message: 'invalid JSON'});
        } else if (err.length) {
            handleErrors(err);
            return callback({
                'class': 'icon-circle-blank',
                title: 'invalid GeoJSON',
                message: 'invalid GeoJSON'});
        } else {
            var zoom = changeObj.from.ch === 0 &&
                changeObj.from.line === 0 &&
                changeObj.origin == 'paste';

            var gj = JSON.parse(editor.getValue());

            try {
                return callback(null, gj, zoom);
            } catch(e) {
                return callback({
                    'class': 'icon-circle-blank',
                    title: 'invalid GeoJSON',
                    message: 'invalid GeoJSON'});
            }
        }

        function handleError(msg) {
            var match = msg.match(/line (\d+)/);
            if (match && match[1]) {
                editor.clearGutter('error');
                editor.setGutterMarker(parseInt(match[1], 10) - 1, 'error', makeMarker(msg));
            }
        }

        function handleErrors(errors) {
            editor.clearGutter('error');
            errors.forEach(function(e) {
                editor.setGutterMarker(e.line, 'error', makeMarker(e.message));
            });
        }

        function makeMarker(msg) {
            return d3.select(document.createElement('div'))
                .attr('class', 'error-marker')
                .attr('message', msg).node();
        }
    };
};
