const HelpContent = require('../../data/help.md').default;
const ApiContent = require('../../API.md').default;

module.exports = function () {
  const html = `${HelpContent.html}<br><hr><br>${ApiContent.html}`;

  function render(selection) {
    selection.html('').append('div').attr('class', 'pad2 prose').html(html);
  }

  render.off = function () {};

  return render;
};
