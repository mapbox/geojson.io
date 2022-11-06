const fs = require('fs');
const marked = require('marked');

module.exports = function () {
  const html =
    fs.readFileSync('data/help.html') +
    '<br><hr><br>' +
    marked(fs.readFileSync('API.md', 'utf8'));
  function render(selection) {
    selection.html('').append('div').attr('class', 'pad2 prose').html(html);
  }

  render.off = function () {};

  return render;
};
