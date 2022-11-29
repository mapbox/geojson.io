const MapboxDraw = require('@mapbox/mapbox-gl-draw');

const DirectSelect = {
  ...MapboxDraw.modes.direct_select,
  onDrag: function (state, e) {
    if (state.canDragMove !== true) return;
    state.dragMoving = true;
    e.originalEvent.stopPropagation();

    const delta = {
      lng: e.lngLat.lng - state.dragMoveLocation.lng,
      lat: e.lngLat.lat - state.dragMoveLocation.lat
    };
    if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
    else if (e.originalEvent.shiftKey) this.dragFeature(state, e, delta);

    state.dragMoveLocation = e.lngLat;
  }
};

module.exports = DirectSelect;
