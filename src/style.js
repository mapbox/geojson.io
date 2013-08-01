module.exports = function(container, updates) {
    container.html('');

    updates.on('update_map.mode', function(data) {

        function render() {
            var feature = container
                .selectAll('.feature')
                .data(data.features, function(d, i) { return i; });

            var featureEnter = feature.enter()
                .append('div')
                .attr('class', 'feature pad1')
                .call(function() {
                    var featureEnter = this;
                    var featureObj = featureEnter.datum();
                    this.append('div')
                        .attr('class', 'mini-map')
                        .call(function(container) {
                            var d = container.datum();
                            var map = L.mapbox.map(this.node(), 'tmcw.map-7s15q36b', {
                                scrollWheelZoom: false
                            });
                            var gjL = L.geoJson(d).addTo(map);
                            gjL.eachLayer(function(l) {
                                setStyles(l);
                            });
                            function setStyles(l) {
                                var properties = l.toGeoJSON().properties;
                                if (properties.fill_color) l.setStyle({ fillColor: properties.fill_color });
                                if (properties.stroke_color) l.setStyle({ color: properties.stroke_color });
                            }
                            map.fitBounds(gjL.getBounds());
                        });

                    if (['Polygon', 'MultiPolygon'].indexOf(featureObj.geometry.type) !== -1) {

                        // fill
                        this.append('label')
                            .attr('class', 'shared')
                            .text('Fill');
                        var fillSwatchContainer = this.append('div')
                            .attr('class', 'swatches shared');
                        var color = d3.scale.category20c();
                        fillSwatches = fillSwatchContainer.selectAll('.swatch')
                            .data(['#03f'].concat(d3.range(9).map(color)))
                            .enter()
                            .append('div')
                            .attr('class', 'swatch')
                            .style('background-color', String)
                            .on('click', function(d) {
                                fillSwatches.classed('active', function() {
                                    return this == d3.event.target;
                                });
                                featureObj.properties.fill_color = d;
                                updates.update_editor(data);
                            })
                            .classed('active', function(d) {
                                return featureObj.properties.fill_color == d;
                            });

                        // fill
                        this.append('label')
                            .attr('class', 'horizontal shared')
                            .text('Fill Opacity');

                        this.append('div')
                            .attr('class', 'shared')
                            .append('input')
                            .attr('type', 'range')
                            .attr('min', 0)
                            .attr('step', 0.1)
                            .attr('max', 1)
                            .on('change', function() {
                                featureObj.properties.fill_opacity = this.value;
                                updates.update_editor(data);
                            })
                            .property('value', featureObj.properties.fill_opacity || 0.2);
                    }

                    // stroke
                    this.append('label')
                        .attr('class', 'shared')
                        .text('Line Color');

                    var strokeSwatchContainer = this.append('div')
                        .attr('class', 'swatches shared');
                    var color = d3.scale.category20c();

                    var strokeSwatches = strokeSwatchContainer.selectAll('.swatch')
                        .data(['#03f'].concat(d3.range(9).map(color)))
                        .enter()
                        .append('div')
                        .attr('class', 'swatch')
                        .style('background-color', String)
                        .on('click', function(d) {
                            strokeSwatches.classed('active', function() {
                                return this == d3.event.target;
                            });
                            featureEnter.datum().properties.stroke_color = d;
                            updates.update_editor(data);
                        })
                        .classed('active', function(d) {
                            return featureObj.properties.stroke_color == d;
                        });

                    // fill
                    this.append('label')
                        .attr('class', 'shared')
                        .text('Line Opacity');

                    this.append('div')
                        .attr('class', 'shared')
                        .append('input')
                        .attr('type', 'range')
                        .attr('min', 0)
                        .attr('step', 0.1)
                        .attr('max', 1)
                        .on('change', function() {
                            featureObj.properties.stroke_opacity = this.value;
                            updates.update_editor(data);
                        })
                        .property('value', featureObj.properties.stroke_opacity || 0.5);

                    // fill
                    this.append('label')
                        .attr('class', 'shared')
                        .text('Line Weight');

                    this.append('div')
                        .attr('class', 'shared')
                        .append('input')
                        .attr('type', 'range')
                        .attr('min', 0)
                        .attr('step', 0.1)
                        .attr('max', 10)
                        .on('change', function() {
                            featureObj.properties.stroke_width = this.value;
                            updates.update_editor(data);
                        })
                        .property('value', featureObj.properties.stroke_width || 2);
                });
        }

        render();
    });
};
