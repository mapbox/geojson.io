# Changelog

Recent changes to the geojson.io application. Entries are grouped by ship date.

## 2026-06-04

- **Delete all features:** Adds a delete all button to the feature editor header. Operation is undoable via Ctrl-Z. ([#993](https://github.com/mapbox/geojson.io/pull/993))
- **Numpad Delete key fix:** The Delete key on numpads (numlock off) now correctly deletes selected features. ([#993](https://github.com/mapbox/geojson.io/pull/993))
- **Map URL coordinate precision:** Increased lat/lng precision in the `?map=` query param from 2 to 4 decimal places. ([#993](https://github.com/mapbox/geojson.io/pull/993))
- **GeoJSON editor fold gutter:** Adds a fold gutter to the GeoJSON editor panel for collapsing nested objects and arrays. ([#993](https://github.com/mapbox/geojson.io/pull/993))
- **GL JS Update:** Bump to `v3.24.0` [#992](https://github.com/mapbox/geojson.io/pull/992)
- **Replace Standard Light and Dark with Classic Light/Dark:** Removes light and dark themes based on Mapbox Standard for `light-v11` and `dark-v11` for faster performance by default. [#992](https://github.com/mapbox/geojson.io/pull/992)
- **TMS Support for inverted -y**: Adds support for TMS raster tileset URLs which use an inverted y in the url `...{z}/{x}/{-y}.png` [#991](https://github.com/mapbox/geojson.io/pull/991)

## 2026-06-01

- **Add Mobile Meta viewport Tag** - Fix for browsers properly handling mobile viewports.

## 2026-05-28

- **Add fog to non-standard styles:** Adds fog to the OSM and Outdoors basemaps for consistency across all basemap options. ([#980](https://github.com/mapbox/geojson.io/pull/980))

## 2026-05-27

- **Add globe projection and 3d features toggle:** Adds a toggle to switch between globe and mercator projections and to toggle 3d features on basemaps that support them. ([#975](https://github.com/mapbox/geojson.io/pull/975))

## 2026-05-12

- **Persist Camera View:** Camera options (map view) are persisted in sessionStorage and are available via query params for sharing specific views ([#967](https://github.com/mapbox/geojson.io/pull/967))
- **ChangeLog added to About:** - The About Modal now includes 5 most recent changelog entries and includes link to full changelog (Github)([#970](https://github.com/mapbox/geojson.io/pull/970))

## 2026-05-05

- **Feature editor:** Collapsible UI in the Feature Editor to reduce visual clutter when not using Selected Feature editor ([#965](https://github.com/mapbox/geojson.io/pull/965))
- **URL sharing:** Support legacy hash-based `#data=` URLs and strip query params from the URL after data loads ([#966](https://github.com/mapbox/geojson.io/pull/966))

## 2026-05-04

- **Keyboard shortcuts:** Localized keybinding hints for Mac vs. Windows/Linux ([#968](https://github.com/mapbox/geojson.io/pull/968))

## 2026-04-21

- **Custom raster layers:** Add, edit, reorder, and toggle visibility of your own raster tile layers ([#963](https://github.com/mapbox/geojson.io/pull/963))

## 2026-04-20

- **Pitch & Rotation:** Pitch and rotation/bearing support for tilted/rotated map views
- **Left panel:** Default starter state with helpful links to supported file types ([#962](https://github.com/mapbox/geojson.io/pull/962))
- **Basemap:** Restored OpenStreetMap basemap option

## 2026-04-02

- **Simple style markers:** Render and edit `marker-color`, `marker-symbol`, and `marker-size` properties on point features ([#961](https://github.com/mapbox/geojson.io/pull/961))

## 2026-02-27

- **Drawing:** Fixed an extra coordinate being added when finishing polygons

## 2026-02-12

- **Reliability:** Fixed history (undo/redo) creation in some edit flows ([#948](https://github.com/mapbox/geojson.io/pull/948))
- Internal analytics added to the new app

## 2026-02-11

- **Rendering:** Fixed black circles on the dark basemap
- **Mobile:** Restored vertical layout on small screens

## 2026-01-16

- **UI:** "Zoom to all" is now disabled when there are no features ([#942](https://github.com/mapbox/geojson.io/pull/942))
- **Rendering:** Fixed deck.gl circle offset when using the Standard style ([#943](https://github.com/mapbox/geojson.io/pull/943))

## 2026-01-13

- Initial deployment of the new geojson.io at the `/next` path
