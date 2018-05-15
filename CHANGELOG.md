# CHANGELOG

## Next Release

* OpenCycleMap requires an API key and the layer is disabled by default (#577, #604).

## 2014-10-13

* Updated `shp-write`: shapefile writing should work again.

## 2014-09-10

* Updated `geojsonhint`: Feature `id` properties are now properly validated.

## 2014-09-09

* Added Flatten task to Meta menu with `geojson-flatten`

## 2014-08-07

* Bugfixes
* Github commit message now correct
* Subsequent commits fixed

## 2014-08-01

* Added Meta menu with Clear and Random Points tasks
* Added background to top bar
* Removed Dockerfile, Vagrantfile, and other gunk.

## 2014-07-30

* Support loading large Gist files.

## 2014-05-23

* Fix non-anonymous gist editing.

## 2014-05-16

* Moves input and output UIs to modals so that the right sidebar isn't overloaded
* Visual cleanup: fewer icons, more map
* Removes geocoding UI

## 2013-12-10

* Support for downloading points as DSV

## 2013-11-25

* Added ability to rename GeoJSON properties in the table view

## 2013-11-18

* Fix coordinate order in popups

## 2013-10-11

![KML Import](http://i.imgur.com/f0L156A.gif)

* [KML](https://developers.google.com/kml/documentation/) export support
  with [tokml](https://github.com/mapbox/tokml)

## 2013-10-07

* Fix iframe embeds
* Popups now show (latitude, longitude) for points or total length for lines.

## 2013-10-04

![URL Loading](http://i.imgur.com/nfvLdjd.gif)

* Support for `data=text/x-url,` argument to load GeoJSON files on the web via [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
* [URL API Documentation](https://github.com/mapbox/geojson.io/blob/gh-pages/API.md)
* Console API Documentation & Console API

## 2013-10-01

* Shapefile export (beta)

![Shapefile Export](http://i.imgur.com/5zpt1d3.gif)

## 2013-9-30

* Use MapBox markers to expose style options
* Fix bug with retina monitors and github file previews
* Hit `Cmd+O` to quickly import a new file

## 2013-09-25

* Numbers in GeoJSON properties are coerced to be numeric when appropriate

## 2013-09-24

* Drag and drop of multiple files is supported - files in folders are unfortunately
  not supported due to core JS/DOM limitations.
* Help panel, first resurgence of in-UI documentation and first listing of
  keyboard shortcuts
* Easter-egg status TopoJSON output
* Zoom to copy-pasted new features

## 2013-09-11

* Fixed mobile/read-only mode

## 2013-09-09

![](http://i.imgur.com/QgPQkVT.gif)

* First release of [geojsonio-cli](github.com/mapbox/geojsonio-cli) and matching
  functionality on the web side
* [OpenStreetMap](http://www.openstreetmap.org/) format support - import
  [OSM XML](http://wiki.openstreetmap.org/wiki/OSM_XML) files onto the map with
  [osm-and-geojson](https://npmjs.org/package/osm-and-geojson).
