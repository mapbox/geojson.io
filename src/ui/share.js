const gist = require('../source/gist'),
  modal = require('./modal');

module.exports = share;

// function facebookUrl(_) {
//   return (
//     'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(_)
//   );
// }

// function twitterUrl(_) {
//   return (
//     'https://twitter.com/intent/tweet?source=webclient&text=' +
//     encodeURIComponent(_)
//   );
// }

// function emailUrl(_) {
//   return (
//     'mailto:?subject=' +
//     encodeURIComponent('My Map on geojson.io') +
//     "&body=Here's the link: " +
//     encodeURIComponent(_)
//   );
// }

function share(context) {
  return function () {
    gist.saveBlocks(context.data.get('map'), (err, res) => {
      const m = modal(d3.select('div.geojsonio'));
      m.select('.m').attr('class', 'modal-splash modal col6');

      const content = m.select('.content');

      content
        .append('div')
        .attr('class', 'header pad2 fillD')
        .append('h1')
        .text('Share');

      if (err || !res) {
        content
          .append('div')
          .attr('class', 'pad2')
          .text('Could not share: an error occurred: ' + err);
      } else {
        const container = content.append('div').attr('class', 'pad2');
        container
          .append('input')
          .style('width', '100%')
          .property('value', 'http://bl.ocks.org/d/' + res.id);
        container.append('p').text('URL to the full-screen map in that embed');
      }
    });
  };
}
