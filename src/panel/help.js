import React from "react";

export default () => (
  <div className="flex-auto lh-copy pa4 overflow-auto">
    <div>
      <h2>Help</h2>

      <p>
        New here? <strong>geojson.net</strong> is a quick, simple tool for
        creating, viewing, and sharing maps. geojson.net is named after{" "}
        <a href="http://geojson.org/" target="_blank">
          GeoJSON
        </a>, an open source data format, and it supports GeoJSON in all ways -
        but also accepts KML, GPX, CSV, GTFS, TopoJSON, and other formats.
      </p>

      <p>Need extra help or see a bug? </p>
      <a
        target="_blank"
        href="https://github.com/tmcw/geojson.net/issues?state=open"
      >
        Open an issue on geojson.net's issue tracker.
      </a>
      <h3>I've got data</h3>
      <p>
        If you have data, like a KML, GeoJSON, or CSV file, just drag &amp; drop
        it onto the page or click 'Open' and 'File' - your data should appear on
        the map!
      </p>
      <h3>I want to draw features</h3>
      <p>
        Click the drawing tools on the left-hand side to draw points, polygons,
        lines and rectangles. After you're done drawing the shapes, you can add
        information to each feature by clicking on it, editing the feature's
        properties, and clicking 'Save'.
      </p>
      <p>
        Properties in GeoJSON are stored as 'key value pairs' - so, for
        instance, if you wanted to add a name to each feature, type 'name' in
        the first table field, and the name of the feature in the second.
      </p>
      <h3>I want to use my map everywhere</h3>
      <p>
        You can share maps in quite a few ways! If you save your map here, the
        URL of this page will update and you can link send friends the link to
        share the map, or you can click 'Download' to grab the raw GeoJSON data
        and use it in other software, like TileMill or Leaflet.
      </p>
      <h3>Protips?</h3>
      <ul>
        <li>
          <strong>cmd+s</strong>: save map to github gists
        </li>
        <li>
          <strong>cmd+a</strong>: download map as geojson
        </li>
        <li>
          <strong>arrow keys</strong>: navigate the map
        </li>
      </ul>
      <h3>Privacy &amp; License Issues</h3>
      <ul>
        <li>
          <strong>Clicking save</strong> by default saves to a private GitHub
          Gist - so it will only be accessible to people you share the URL with,
          and creating it won't appear in your GitHub timeline.
        </li>
        <li>
          <strong>The data you create and modify in geojson.net</strong> doesn't
          acquire any additional license: if it's secret and copyrighted, it
          will remain that way - it doesn't have to be public or open source.
        </li>
      </ul>
    </div>
  </div>
);
