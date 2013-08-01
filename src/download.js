// Download as file
function download(container, editor) {
    var button = container.append('button').on('click', saveAsFile);
    button.append('span').attr('class', 'icon icon-download');

    function saveAsFile() {
        var content = editor.getValue();
        if (content) {
            saveAs(new Blob([content], {
                type: 'text/plain;charset=utf-8'
            }), 'map.geojson');
        }
    }
}
