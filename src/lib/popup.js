module.exports = function (context) {
  return function (e, id) {
    const sel = d3.select(e.target._content);

    sel.selectAll('.cancel').on('click', clickClose);

    sel.selectAll('form').on('submit', saveFeature);

    sel.selectAll('.add').on('click', addRow);

    sel
      .selectAll('.add-simplestyle-properties-button')
      .on('click', addSimplestyleProperties);

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
      const fl = parseFloat(x);
      if (fl.toString() === x) return fl;
      else return x;
    }

    function saveFeature() {
      const obj = {};
      const table = sel.select('table.marker-properties');
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
      const tr = sel.select('table.marker-properties tbody').append('tr');

      tr.append('th').append('input').attr('type', 'text');

      tr.append('td').append('input').attr('type', 'text');
    }

    function addSimplestyleProperties() {
      // hide the button
      sel
        .selectAll('.add-simplestyle-properties-button')
        .style('display', 'none');

      const data = context.data.get('map');
      const feature = data.features[id];
      const { properties, geometry } = feature;

      if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
        if (!('marker-color' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'marker-color');
          tr.append('td')
            .append('input')
            .attr('type', 'color')
            .attr('value', '#7E7E7E');
        }

        if (!('marker-size' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'marker-size');
          const td = tr.append('td');
          td.append('input')
            .attr('type', 'text')
            .attr('value', 'medium')
            .attr('list', 'marker-size');
          const datalist = td.append('datalist').attr('id', 'marker-size');
          datalist.append('option').attr('value', 'small');
          datalist.append('option').attr('value', 'medium');
          datalist.append('option').attr('value', 'large');
        }

        if (!('marker-symbol' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'marker-symbol');
          const td = tr.append('td');
          td.append('input')
            .attr('type', 'text')
            .attr('value', 'circle')
            .attr('list', 'marker-symbol');
          const datalist = td.append('datalist').attr('id', 'marker-symbol');
          for (let i = 0; i < makiNames.length; i++) {
            datalist.append('option').attr('value', makiNames[i]);
          }
        }
      }
      if (
        geometry.type === 'LineString' ||
        geometry.type === 'MultiLineString' ||
        geometry.type === 'Polygon' ||
        geometry.type === 'MultiPolygon'
      ) {
        if (!('stroke' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'stroke');
          tr.append('td')
            .append('input')
            .attr('type', 'color')
            .attr('value', '#555555');
        }
        if (!('stroke-width' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'stroke-width');
          tr.append('td')
            .append('input')
            .attr('type', 'number')
            .attr('min', '0')
            .attr('step', '0.1')
            .attr('value', '2');
        }
        if (!('stroke-opacity' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'stroke-opacity');
          tr.append('td')
            .append('input')
            .attr('type', 'number')
            .attr('min', '0')
            .attr('max', '1')
            .attr('step', '0.1')
            .attr('value', '1');
        }
      }
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        if (!('fill' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'fill');
          tr.append('td')
            .append('input')
            .attr('type', 'color')
            .attr('value', '#555555');
        }
        if (!('fill-opacity' in properties)) {
          const tr = sel.select('table.marker-properties tbody').insert('tr');
          tr.append('th')
            .append('input')
            .attr('type', 'text')
            .attr('value', 'fill-opacity');
          tr.append('td')
            .append('input')
            .attr('type', 'number')
            .attr('min', '0')
            .attr('max', '1')
            .attr('step', '0.1')
            .attr('value', '0.5');
        }
      }
    }
  };
};
