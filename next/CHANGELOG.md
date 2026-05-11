# Changelog

Recent changes to the geojson.io application. Entries are grouped by ship date.

## 2026-05-05

- **Feature editor:** Collapsible UI in the Feature Editor for working with large property sets ([#965](https://github.com/mapbox/geojson.io/pull/965))
- **URL sharing:** Support legacy hash-based `#data=` URLs and strip query params from the URL after data loads ([#966](https://github.com/mapbox/geojson.io/pull/966))

## 2026-05-04

- **Keyboard shortcuts:** Localized keybinding hints for Mac vs. Windows/Linux ([#968](https://github.com/mapbox/geojson.io/pull/968))

## 2026-04-21

- **Custom raster layers:** Add, edit, reorder, and toggle visibility of your own raster tile layers ([#963](https://github.com/mapbox/geojson.io/pull/963))

## 2026-04-20

- **Map controls:** Pitch and bearing support for tilted/rotated map views
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
