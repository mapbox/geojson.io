const MapboxDraw = require('@mapbox/mapbox-gl-draw');

const SimpleSelect = {
  ...MapboxDraw.modes.simple_select,
  onDrag: function (state, e) {
    if (state.canDragMove && e.originalEvent.shiftKey)
      return this.dragMove(state, e);
    if (this.drawConfig.boxSelect && state.canBoxSelect)
      return this.whileBoxSelect(state, e);
  }
};

module.exports = SimpleSelect;
