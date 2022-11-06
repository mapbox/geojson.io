const { test, expect } = require('@playwright/test');

const {
  waitForDefaultGeojson,
  getEditorValue,
  clearGeojson,
  clickOnMap
} = require('./util');

test.describe.configure({ mode: 'serial' });

const url = 'http://localhost:5500 ';

let page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();

  // accept all dialogs e.g. Meta > Clear
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(url);

  // wait for the dummy geojson to appear in the editor,
  // this is a proxy for the site being loaded and ready to use
  await waitForDefaultGeojson(page);
});

test.afterAll(async () => {
  await page.close();
});

test('draw a Point feature', async () => {
  // click the marker tool
  await page.locator('.mapbox-gl-draw_point').click();

  await clickOnMap([[300, 300]], page);

  const geoJson = await getEditorValue(page);

  expect(geoJson).toEqual(`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          9.361109341957814,
          4.899174597982167
        ],
        "type": "Point"
      }
    }
  ]
}`);

  await clearGeojson(page);
});

test('draw a LineString feature', async () => {
  await page.locator('.mapbox-gl-draw_line').click();

  await clickOnMap([[200, 200]], page);

  // move the mouse and check the map sources to make sure we
  // are seeing the correct line measurements
  await page.mouse.move(400, 400);
  const length = await page.evaluate(() => {
    return window.map
      .getStyle()
      .sources['mapbox-gl-draw-hot'].data.features.find(
        (d) => d.properties.meta && d.properties.meta === 'currentPosition'
      ).properties.distance;
  });

  expect(length).toEqual('3936.14 km\n2445.81 mi');

  await clickOnMap(
    [
      [400, 400],
      [400, 400]
    ],
    page
  );

  const geoJson = await getEditorValue(page);

  expect(geoJson).toEqual(`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            -6.837469562922877,
            18.831915291838698
          ],
          [
            22.01557817097037,
            -7.637251255306964
          ]
        ],
        "type": "LineString"
      }
    }
  ]
}`);

  await clearGeojson(page);
});

test('draw a Polygon feature', async () => {
  await page.locator('.mapbox-gl-draw_polygon').click();

  await clickOnMap(
    [
      [200, 200],
      [400, 200],
      [400, 400],
      [200, 400],
      [200, 200]
    ],
    page
  );

  const geoJson = await getEditorValue(page);
  expect(geoJson).toEqual(`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            [
              -6.837469562922877,
              18.831915291838698
            ],
            [
              -4.940578531501615,
              -7.9581159583439955
            ],
            [
              22.01557817097037,
              -7.637251255306964
            ],
            [
              22.13784209088817,
              17.95627129279019
            ],
            [
              -6.837469562922877,
              18.831915291838698
            ]
          ]
        ],
        "type": "Polygon"
      }
    }
  ]
}`);
});
