# geojson.io

![](http://i.cloudup.com/kz3BAF7Hnx.png)

a fast, simple editor for map data.

## using it

![](http://i.cloudup.com/d6Z9dko1gr.png)

[Using geojson.io with GitHub is better with the Chrome Extension](https://github.com/mapbox/geojsonio-extension/releases/tag/v0.2.0)

## development

Libraries are concatenated into `lib/lib.js` by running `make`.

Run a local server with [visionmedia/serve](https://github.com/visionmedia/serve):

    serve -p 8080

Port 8080 is recommended because by default geojson.io will use a
[prose/gatekeeper](https://github.com/prose/gatekeeper) auth server that redirects
back to `http://localhost:8080/` for GitHub OAuth.

## libraries

This is made up of small reusable chunks:

* <a href='http://github.com/tmcw/d3-metatable'>github.com/tmcw/d3-metatable</a>
* <a href='http://github.com/tmcw/geojsonhint'>github.com/tmcw/geojsonhint</a>
* <a href='http://github.com/tmcw/d3-bucket-ui'>github.com/tmcw/d3-bucket-ui</a>
* <a href='http://github.com/tmcw/geocode-many'>github.com/tmcw/geocode-many</a>
* <a href='http://github.com/tmcw/csv2geojson'>github.com/tmcw/csv2geojson</a>
* <a href='http://github.com/tmcw/togeojson'>github.com/tmcw/togeojson</a>

## see also

* [TileMill](http://www.mapbox.com/tilemill/) for styling maps
* [MapBox](http://www.mapbox.com/) for all of the APIs used in geojson.io
