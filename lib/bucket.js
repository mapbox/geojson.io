function bucket() {

    var event = d3.dispatch('chosen'),
        deposits;

    return {
        deposit: deposit,
        store: store
    };

    function deposit() {
        return function(selection) {
            deposits = selection;
            selection.each(function() {
                var sel = d3.select(this);
                sel.attr('data-text', sel.text());
            });
        };
    }

    function store() {
        var clone, dropped, dims;
        function change() {
            event.chosen(
            deposits.filter(function() {
                return d3.select(this).classed('filled');
            })
            .map(function(elems) {
                return elems.map(function(e) {
                    return d3.select(e).text();
                });
            })[0]);
        }
        var drag = d3.behavior.drag()
            .origin(function() {
                // return { x: d3.event.pageX, y: d3.event.pageY };
                return { x: this.offsetLeft, y: this.offsetTop };
            })
            .on('dragstart', function() {
                clone = d3.select(this.parentNode.insertBefore(this.cloneNode(true), this));
                d3.select(this)
                    .style('position', 'absolute')
                    .style('pointer-events', 'none');
                dims = [this.offsetWidth, this.offsetHeight];
            })
            .on('drag', function() {
                d3.select(this)
                    .style('left', d3.event.x - (dims[0] / 2) + 'px')
                    .style('top', d3.event.y - (dims[1] / 2) + 'px');
            })
            .on('dragend', function() {
                var self = d3.select(this);
                var target = d3.select(d3.event.sourceEvent.target);
                if (target.classed('bucket')) {
                    target
                        .text(self.text())
                        .classed('filled', true);
                    target
                        .append('span')
                        .classed('remove-button', true)
                        .on('click', function() {
                            target
                                .text(target.attr('data-text'))
                                .classed('filled', false);
                            change();
                        });
                    self.remove();
                    clone.call(drag);
                    change();
                } else {
                    self.remove();
                    clone.call(drag);
                }
            });

        return d3.rebind(function(selection) {
            selection.each(function() {
                var sel = d3.select(this).call(drag);
                sel.attr('data-text', sel.text());
            });
        }, event, 'on');
    }
}
