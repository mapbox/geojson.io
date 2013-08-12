module.exports = commitPanel;
function commitPanel(container, updates) {
    container.html('');

    var wrap = container.append('div')
        .attr('class', 'pad1 center');

    var message = wrap.append('textarea')
        .attr('placeholder', 'Commit message')
        .attr('class', 'full-width');

    wrap.append('button')
        .text('Commit changes to GitHub')
        .attr('class', 'semimajor')
        .on('click', function() {
            saveChanges(message.property('value'), function() {
                alert('Changes saved!');
            });
        });
}
