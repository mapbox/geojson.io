**geojson.io** is a helpful open-source tool for creating, and editing spatial data. With geojson.io, you can quickly create new datasets, edit existing ones, and export your work for use in other applications.

The [GeoJSON](https://geojson.org/) format provides a simple, widely-used way to represent geographic features and their properties using JSON.

## Importing Data

You can start working with data in several ways:

- **Import button:** Click the **Import button** to select and upload a data file.
- **Drag & Drop:** Drag a data file directly onto the map.
- **Paste GeoJSON:** Paste GeoJSON text directly into the **JSON panel**.

When importing GeoJSON, you can import a `Geometry`, `Feature`, or `FeatureCollection`.

You don't have to import data to get started—just use the drawing tools to create new features from scratch!

## Working with Features

Features in your dataset are listed in the left sidebar. You can:

- Drag and drop features to reorder them.
- Double-click a feature to zoom the map to its location.
- Right-click a feature for additional options.
- Toggle a feature's visibility using the eye icon.
- Use the label menu to choose a property to use as a label to help identify features.

Use the drawing tools to add a new feature. You can add points, lines, polygons, rectangles, and circles (Circles are represented as polygons with 64 vertices since GeoJSON does not support true circles).

When one or more features are selected, an additional set of tools will appear, including geometry operations, duplication, and more. You can select multiple features by holding <kbd>Shift</kbd> and clicking features in the left sidebar or map.

### Editing Geometries

Select a feature to edit its geometry.

- Drag vertices to reshape lines and polygons.
- Drag the midpoint between vertices to add a new vertex.
- <kbd>Delete</kbd> to delete a selected vertex.
- <kbd>Option</kbd> + drag a vertex to snap to nearby features.
- Hold <kbd>Space</kbd> and drag to move a feature.
- <kbd>CMD</kbd> + <kbd>Option</kbd> + drag to rotate a feature.

### Editing Properties

When one ore more features are selected, the **Feature Editor** panel will appear with a table for editing properties. You can select more than one feature to make bulk property updates.

You may also edit properties in the **Table Panel**, where you can browse all features.

## Exporting data

Use the **export button** to save your data, or copy GeoJSON from the **JSON panel**.

In addition to exporting GeoJSON, you can choose other file formats such as KML, CSV, or Shapefile.

When export GeoJSON, geojson.io always exports a FeatureCollection.

## Keyboard Shortcuts

<table>
  <thead>
    <tr>
      <th>Shortcut</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><kbd>1</kbd></td><td>Select</td></tr>
    <tr><td><kbd>2</kbd></td><td>Draw point</td></tr>
    <tr><td><kbd>3</kbd></td><td>Draw line</td></tr>
    <tr><td><kbd>4</kbd></td><td>Draw polygon</td></tr>
    <tr><td><kbd>5</kbd></td><td>Draw rectangle</td></tr>
    <tr><td><kbd>Esc</kbd></td><td>Exit drawing / clear selection</td></tr>
    <tr><td><kbd>]</kbd></td><td>Next panel</td></tr>
    <tr><td><kbd>[</kbd></td><td>Previous panel</td></tr>
    <tr><td><kbd>⌘+k</kbd></td><td>Search</td></tr>
    <tr><td><kbd>⌘+o</kbd></td><td>Open</td></tr>
    <tr><td><kbd>⌘+s</kbd></td><td>Save</td></tr>
    <tr><td><kbd>⌘+a</kbd></td><td>Select all</td></tr>
    <tr><td><kbd>⌘+z</kbd></td><td>Undo</td></tr>
    <tr><td><kbd>⌘+y</kbd></td><td>Redo</td></tr>
  </tbody>
</table>

## Mouse Controls

- **Click** to select a feature.
- Hold down <kbd>Shift</kbd> while drawing lines or polygons to draw with right angles.
- **Shift-click** to select additional features.
- **Shift-click** and drag to select features using the rectangular lasso tool.
- **Right-click** on a feature to transform, delete, or inspect it.
- Hold down <kbd>Space</kbd> and drag to move features.
- When a feature is already selected, **Shift-click** and **Shift-click-drag** will select vertexes from that feature.

## URL Parameters

You can load data into geojson.io using URL parameters.

| Parameter                                                              | Example                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`<br/> Load data from a URL or data URI (GeoJSON, KML, CSV, etc.) | `?data=https://example.com/file.geojson`<br>`?data=data:application/json,%7B...%7D`<br/> [URL Example](?data=https%3A%2F%2Fraw.githubusercontent.com%2Fcodeforgermany%2Fclick_that_hood%2Fmain%2Fpublic%2Fdata%2Fcalifornia-counties.geojson) <br/> [Data URI Example](?data=data:application/json,%7B%22type%22%3A%22LineString%22%2C%22coordinates%22%3A%5B%5B0%2C0%5D%2C%5B10%2C10%5D%5D%7D) |
| `id` <br/> Load data from a GitHub path or Gist resource               | `?id=github:username/repo/branch/path/to/file.geojson`<br>`?id=gist:username/gistid` <br/> [Github Example](?id=github:benbalter/dc-wifi-social/blob/master/bars.geojson) <br/> [Gist Example](?id=gist:tmcw/e9a29ad54dbaa83dee08)                                                                                                                                                              |

## SimpleStyle

**geojson.io** supports [simplestyle spec](https://github.com/mapbox/simplestyle-spec) for linestrings and polygons, allowing you to style the geometries shown on the map by adding specific properties (for example, `fill` or `stroke` to set fill and outline colors) to your GeoJSON features.

## More Information

- [GeoJSON specification](https://geojson.org/)
- [Simplestyle spec](https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0)
- [Mapbox GeoJSON Guide](https://docs.mapbox.com/help/glossary/geojson/)
- [geojson.io Github Repository](https://github.com/mapbox/geojson.io)
