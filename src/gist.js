function saveAsGist(content) {
    var h = new window.XMLHttpRequest();

    h.onload = function() {
        if (this.status < 400 && this.responseText) {
            var d = (JSON.parse(h.responseText));
            window.location.hash = '#' + d.id;

            hereLink.html(window.location)
                .attr('href', window.location);

            var gistUrl = 'http://gist.github.com/' + d.id;
            gistLink.html(gistUrl)
                .attr('href', gistUrl);

            linkUi.attr('class', 'link-ui active');
        } else {
            alert('Gist API limit exceeded; saving to GitHub temporarily disabled.');
        }
    };
    h.onerror = function() {};
    h.open('POST', 'https://api.github.com/gists', true);
    h.send(JSON.stringify({
        description: 'Gist from edit-GeoJSON',
        public: true,
        files: {
            'map.geojson': {
                content: content
            }
        }
    }));
}

function gistButton(container, editor) {
    var button = container.append('button').on('click', function() {
        saveAsGist(editor.getValue());
    });
    button.append('span').attr('class', 'icon icon-link');
}
