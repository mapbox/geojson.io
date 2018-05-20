var d3 = require("d3");
module.exports = function(context) {
  return function(e) {
    var sel = d3.select(e.popup._contentNode);

    sel.selectAll(".cancel").on("click", clickClose);

    sel.selectAll(".save").on("click", saveFeature);

    sel.selectAll(".add").on("click", addRow);

    sel.selectAll(".delete-invert").on("click", removeFeature);

    function clickClose() {
      context.map.closePopup(e.popup);
    }

    function removeFeature() {
      if (e.popup._source && context.mapLayer.hasLayer(e.popup._source)) {
        context.mapLayer.removeLayer(e.popup._source);
        context.data.set({ map: context.mapLayer.toGeoJSON() }, "popup");
      }
    }

    function losslessNumber(x) {
      var fl = parseFloat(x);
      if (fl.toString() === x) return fl;
      else return x;
    }

    function saveFeature() {
      var obj = {};
      var table = sel.select("table.marker-properties");
      table.selectAll("tr").each(collectRow);
      function collectRow() {
        var inputNodes = d3
          .select(this)
          .selectAll("input")
          .nodes();
        var leftValue = d3.select(inputNodes[0]).property("value");
        if (leftValue) {
          obj[leftValue] = losslessNumber(
            d3.select(inputNodes[1]).property("value")
          );
        }
      }
      e.popup._source.feature.properties = obj;
      context.data.set({ map: context.mapLayer.toGeoJSON() }, "popup");
      context.map.closePopup(e.popup);
    }

    function addRow() {
      var tr = sel.select("table.marker-properties tbody").append("tr");

      tr
        .append("th")
        .append("input")
        .attr("type", "text");

      tr
        .append("td")
        .append("input")
        .attr("type", "text");
    }
  };
};
