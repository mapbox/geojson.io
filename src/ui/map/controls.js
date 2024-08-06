class EditControl {
  onAdd(map) {
    this.map = map;
    this._container = document.createElement('div');
    this._container.className =
      'mapboxgl-ctrl-group mapboxgl-ctrl edit-control hidden';

    this._container.innerHTML = `
            <button class="mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_edit" title="Edit geometries" style="background-image: url(img/edit.svg); background-size: 13px 13px;">
              
            </button>
          `;

    return this._container;
  }
}
class SaveCancelControl {
  onAdd(map) {
    this.map = map;
    this._container = document.createElement('div');
    this._container.className =
      'save-cancel-control bg-white rounded pt-1 pb-2 px-2 mt-2 mr-2 float-right clear-both pointer-events-auto';
    this._container.style = 'display: none;';
    this._container.innerHTML = `
            <div class='font-bold mb-0.5'>Editing Geometries</div>
              <div class="flex">
                <button class='mapboxgl-draw-actions-btn mapboxgl-draw-actions-btn_save txt-xs bg-gray-500 hover:bg-gray-700 text-white font-bold py-0 px-2 rounded' title="Save changes.">
                  Save
                </button>
                <button class='mapboxgl-draw-actions-btn mapboxgl-draw-actions-btn_cancel ml-1 txt-xs bg-gray-500 hover:bg-gray-700 text-white font-bold py-0 px-2 rounded' title="Cancel editing, discards all changes.">
                  Cancel
                </button>
              </div>
          `;

    return this._container;
  }
}
class TrashControl {
  onAdd(map) {
    this.map = map;
    this._container = document.createElement('div');
    this._container.className =
      'mapboxgl-ctrl-group mapboxgl-ctrl trash-control';
    this._container.style = 'display: none;';
    this._container.innerHTML = `
        <button class="mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_trash" title="Delete">
        </button>
      `;

    return this._container;
  }
}

module.exports = {
  EditControl,
  SaveCancelControl,
  TrashControl
};
