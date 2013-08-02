// Download as file
function switchMap(container, map, a, b) {
    var button = container.append('button').on('click', click);
    button.append('span').attr('class', 'icon icon-adjust');

    function click() {
        if (map.hasLayer(a)) {
            map.removeLayer(a);
            map.addLayer(b);
        } else {
            map.addLayer(a);
            map.removeLayer(b);
        }
    }
}
