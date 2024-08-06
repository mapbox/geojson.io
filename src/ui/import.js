const importSupport = !!window.FileReader,
  flash = require('./flash.js'),
  readFile = require('../lib/readfile.js'),
  zoomextent = require('../lib/zoomextent');

module.exports = function (context) {
  return function (selection) {
    selection.html('');

    const wrap = selection.append('div').attr('class', 'pad1');

    wrap
      .append('div')
      .attr('class', 'modal-message')
      .text('Drop files to map!');

    if (importSupport) {
      const import_landing = wrap.append('div').attr('class', 'pad2 fillL');

      const message = import_landing.append('div').attr('class', 'center');

      const fileInput = message
        .append('input')
        .attr('type', 'file')
        .style('visibility', 'hidden')
        .style('position', 'absolute')
        .style('height', '0')
        .on('change', function () {
          const files = this.files;
          if (!(files && files[0])) return;
          readFile.readAsText(files[0], (err, text) => {
            readFile.readFile(files[0], text, onImport);
            // node-webkit: path included
            if (files[0].path) {
              context.data.set({
                path: files[0].path
              });
            }
          });
        });

      const button = message.append('button').on('click', () => {
        fileInput.node().click();
      });
      button.append('span').attr('class', 'icon-arrow-down');
      button.append('span').text(' Open');
      message
        .append('p')
        .attr('class', 'deemphasize')
        .append('small')
        .text(
          'GeoJSON, TopoJSON, KML, CSV, GPX and OSM XML supported. You can also drag & drop files.'
        );
    } else {
      wrap
        .append('p')
        .attr('class', 'blank-banner center')
        .text(
          'Sorry, geojson.io supports importing GeoJSON, TopoJSON, KML, CSV, GPX, and OSM XML files, but ' +
            "your browser isn't compatible. Please use Google Chrome, Safari 6, IE10, Firefox, or Opera for an optimal experience."
        );
    }

    function onImport(err, gj, warning) {
      if (err) {
        if (err.message) {
          flash(context.container, err.message).classed('error', 'true');
        }
      } else if (gj && gj.features) {
        context.data.mergeFeatures(gj.features);
        if (warning) {
          flash(context.container, warning.message);
        } else {
          flash(
            context.container,
            'Imported ' + gj.features.length + ' features.'
          ).classed('success', 'true');
        }
        zoomextent(context);
      }
    }

    wrap.append('div').attr('class', 'pad1');
  };
};
