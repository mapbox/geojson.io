module.exports = function (context) {
  return function (e, id) {
    var sel = d3.select(e.target._content);

    sel.selectAll('.cancel').on('click', clickClose);

    sel.selectAll('.save').on('click', saveFeature);

    sel.selectAll('.add').on('click', addRow);

    sel.selectAll('.delete-invert').on('click', removeFeature);

    function clickClose() {
      e.target._onClose();
    }

    function removeFeature() {
      const data = context.data.get('map');
      data.features.splice(id, 1);

      context.data.set({ map: data }, 'popup');

      // hide the popup
      e.target._onClose();
    }

    function losslessNumber(x) {
      var fl = parseFloat(x);
      if (fl.toString() === x) return fl;
      else return x;
    }

    function saveFeature() {
      var obj = {};
      var table = sel.select('table.marker-properties');
      table.selectAll('tr').each(collectRow);
      function collectRow() {
        if (d3.select(this).selectAll('input')[0][0].value) {
          obj[d3.select(this).selectAll('input')[0][0].value] = losslessNumber(
            d3.select(this).selectAll('input')[0][1].value
          );
        }
      }

      const data = context.data.get('map');
      const feature = data.features[id];
      feature.properties = obj;
      context.data.set({ map: data }, 'popup');
      // hide the popup
      e.target._onClose();
    }

    function addRow() {
      var tr = sel.select('table.marker-properties tbody').append('tr');

      tr.append('th').append('input').attr('type', 'text');

      tr.append('td').append('input').attr('type', 'text');
    }
  };
};
