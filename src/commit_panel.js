var github = require('./github');

module.exports = commit;

function commit(container, updates) {
    container.html('');

    var wrap = container.append('div')
        .attr('class', 'pad1 center');

    var message = wrap.append('textarea')
        .attr('placeholder', 'Commit message')
        .attr('class', 'full-width');

    var commitButton = wrap.append('button')
        .text('Commit changes to GitHub')
        .attr('class', 'semimajor');

    updates.on('update_map.mode', function(data, layer, exportIndentationStyle) {
        commitButton.on('click', function() {
            github.saveAsGitHub(
                JSON.stringify(data, null, exportIndentationStyle),
                done,
                message.property('value'));

            function done(err, resp) {
                if (err) return alert(err);
                commitButton.text('Changes saved');
                setTimeout(function() {
                    commitButton.text('Commit changes to GitHub');
                }, 1000);
            }
        });
    });
}
