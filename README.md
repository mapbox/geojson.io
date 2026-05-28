# geojson.io

A fast, simple editor for map data. geojson.io is a browser-based tool for creating and editing spatial data for your mapping projects.

## Features

- Create and edit spatial data (geometries and attributes/properties) in the browser.
- Import and export data in multiple formats, including GeoJSON, KML, CSV, and Shapefile.
- Draw points, lines, polygons, rectangles, and circles on an interactive map.
- Edit feature properties in bulk using the Feature Editor or Table Panel.
- Keyboard shortcuts for efficient editing and navigation.
- Query parameters allow preloading data from external sources.

## Bug Reports & Feature Requests

If you encounter any issues or have suggestions for new features, please open an issue on the [geojson.io GitHub repository](https://github.com/mapbox/geojson.io/issues).

## Development

To run this project locally, you'll need [Node.js](https://nodejs.org/) installed. Then, clone the repository and install dependencies:

```bash
git clone https://github.com/mapbox/geojson-io.git
cd geojson.io
npm install
```

Copy `.env.example` to `.env` and add your public Mapbox token as `VITE_PUBLIC_MAPBOX_TOKEN`.

Then, start the development server:

```bash
npm run dev
```

This will start the application on `http://localhost:5173`. Open this URL in your web browser to view and interact with the application.

## History & Attribution

geojson.io was [originally created](https://github.com/mapbox/geojson.io/commits/main/?after=cb1c8d9d36ad4f6bc1b1c5b602db2f273e780ace+1084) in 2013 by Mapbox engineer [Tom MacWright](https://macwright.com) as a simple editor for GeoJSON, the widely-used format for encoding geographic data structures used heavily in web mapping applications. The earliest versions of the app used Mapbox.js (a Leaflet.js-based mapping library) for map rendering and leaflet-draw for drawing tools.

It has since become a staple tool for developers and GIS professionals working with spatial data, allowing for quick visualization and editing of spatial directly in the browser without the need for complex GIS software or coding. As an open-source project, geojson.io has benefited from hundreds of code contributions from the mapping community over the years.

In late 2022, geojson.io was refactored to use Mapbox GL JS and Mapbox GL Draw, providing vector-based map rendering and improved drawing tools, taking advantage of the latest features from the Mapbox ecosystem.

In early 2026, geojson.io was overhauled using a fork of [Placemark Play](https://play.placemark.io/), another open-source map editor developed by Tom MacWright. These changes improve every aspect of the application, including a modernized React and typescript-based codebase, a more intuitive user interface, superior drawing tools, enhanced performance, and new features such as mulitselect, bulk editing, spatial operations, adding search results as Point features, and improved data import/export options.

- [2013 blog post on mapbox.com (via internet archive)](https://web.archive.org/web/20150918163329/https://www.mapbox.com/blog/geojsonio-announce/)
- [2013 blog post on macwright.com](https://macwright.com/2013/07/26/geojsonio.html)
- [2022 blog post - Updating geojson.io](https://www.mapbox.com/blog/updating-geojson-io)
