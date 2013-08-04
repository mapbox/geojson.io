function geocodemany(mapid, throttle) {
    throttle = (throttle === undefined) ? 200 : throttle;
    return function(list, transform, progress, callback) {

        var q = queue(1),
            todo = list.length,
            out = [],
            left = [],
            statuses = d3.range(todo).map(function() { return undefined; }),
            done = 0;

        function error(err, callback) {
            statuses[done] = false;
            progress({
                todo: todo,
                done: ++done,
                status: 'error',
                statuses: statuses
            });
            setTimeout(function() {
                callback(null, err);
            }, throttle);
        }

        // forgive me
        function copy(o) { return JSON.parse(JSON.stringify(o)); }

        function run(obj, callback) {
            var str = transform(obj);
            var output = copy(obj);
            d3.json('http://api.tiles.mapbox.com/v3/' + mapid + '/geocode/' +
                encodeURIComponent(str) + '.json')
                .on('load', function(data) {
                    if (data && data.results && data.results.length &&
                        data.results[0].length) {

                        var ll = data.results[0][0];
                        output.latitude = ll.lat;
                        output.longitude = ll.lon;
                        statuses[done] = true;
                        progress({
                            todo: todo,
                            done: ++done,
                            status: 'success',
                            statuses: statuses
                        });
                        setTimeout(function() {
                            callback(null, output);
                        }, throttle);

                    } else {

                        error({
                            error: new Error('Location not found'),
                            __iserror__: true,
                            data: output
                        }, callback);

                    }
                })
                .on('error', function(err) {

                    error({
                        error: err,
                        __iserror__: true,
                        data: output
                    }, callback);

                })
                .get();
        }

        function enqueue(obj) {
            q.defer(run, obj);
        }

        list.forEach(enqueue);

        q.awaitAll(function(err, res) {
            callback(res
                .filter(function(r) { return r.__iserror__; })
                .map(function(r) { delete r.__iserror__; return r; }),
                res.filter(function(r) { return !r.__iserror__; }));
        });
    };
}
