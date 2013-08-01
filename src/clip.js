// CLIPBOARD

ZeroClipboard.setDefaults({
    moviePath: 'lib/zeroclipboard/ZeroClipboard.swf'
});

function clipButton(container) {

    var button = container.append('button');
    button.append('span').attr('class', 'icon icon-copy');

    clip = new ZeroClipboard(button.node());

    clip.on('complete', clipComplete);

    clip.on('mousedown', function(client) {
            clip.setText(JSON.stringify(getGeoJSON(), null, 2));
        });

    function clipComplete(client, args) {
        button.classed('done', true);
        button.text('copied to your clipboard');
        setTimeout(function() {
            button.html("<span class='icon icon-copy'></span>");
            button.classed('done', false);
        }, 1000);
    }
}
