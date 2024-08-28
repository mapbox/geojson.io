## Help

**geojson.io** is a quick, simple tool for creating, viewing, and sharing maps. geojson.io is named after [GeoJSON](https://geojson.org/), an open source spatial data format, and it supports GeoJSON in all ways - but also accepts KML, GPX, CSV, GTFS, TopoJSON, and other formats.

Want to request a feature or report a bug? [Open an issue on geojson.io's issue tracker.](https://github.com/mapbox/geojson.io/issues?state=open)

### I've got data

If you have data, like a KML, GeoJSON, or CSV file, just drag & drop it onto the page or click 'Open' and select your file. Your data should appear on the map!

### I want to draw features

Use the drawing tools to draw points, polygons, lines, rectangles, and circles. After you're done drawing the shapes, you can add information to each feature by clicking on it, editing the feature's properties, and clicking 'Save'.

Note: Circles are not supported in GeoJSON, so the circle drawing tool is really creating a circle-shaped polygon with 64 vertices.

### I want to edit features

To edit geometries, click the edit button to enter editng mode. All Features are selected by default. Click to select a Feature or Vertex. Press delete to remove selected Feature or Vertex. Drag to move selected vertex. Hold shift + drag to move selected Feature(s)

Properties in GeoJSON are stored as 'key value pairs'. You can edit properties in three ways: 1 - Click the feature on the map and edit properties in the popup. 2 - Edit properties in the data table, 3 - Edit properties in the Code editor

### I want to style features

geojson.io supports an extended version of [simplestyle-spec](https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0). For point features, besides the standard properties, `marker-color`, `marker-size` and `marker-symbol`, there is also `symbol-color` which defines the color of the symbol.


### I'm a coder

[geojson.io accepts URL parameters](#geojson-io-api) that make it easy to go from a GeoJSON file on your computer to geojson.io.

### Privacy & License Issues

*   **The data you create and modify in geojson.io** doesn't acquire any additional license: if it's secret and copyrighted, it will remain that way - it doesn't have to be public or open source.