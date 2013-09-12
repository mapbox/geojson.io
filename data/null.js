var _plugin = function (context) {
    return function(selection) {
        selection.html('');

        selection.append('h2')
            .text('Null Island!');

        selection.append('button')
            .text('Add Null Island')
            .on('click', island);

        function island() {
            context.data.mergeFeatures([
                {
                    type: 'Feature',
                    properties: {
                        name: 'Null Island'
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                }
            ]);
        }
    };
};
