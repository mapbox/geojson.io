function editorChange() {

    var err = geojsonhint.hint(editor.getValue());
    statusIcon.attr('class', 'icon-circle');
    editor.clearGutter('error');

    if (err instanceof Error) {
        handleError(err.message);
        statusIcon.attr('class', 'icon-circle-blank')
            .attr('title', 'invalid JSON')
            .attr('message', 'invalid JSON');
    } else if (err.length) {
        handleErrors(err);
        statusIcon.attr('class', 'icon-circle-blank')
            .attr('message', 'invalid GeoJSON');
    } else {
        var gj = JSON.parse(editor.getValue());
        try {
            loadGeoJSON(gj);
            statusIcon.attr('message', 'valid');
        } catch(e) {
            statusIcon.attr('class', 'icon-circle-blank')
                .attr('message', 'invalid GeoJSON');
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
}
