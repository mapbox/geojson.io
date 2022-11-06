// on first load or on clear, this empty FeatureCollection is the default
// in context.data.map
const defaultGeoJson = `{
  "type": "FeatureCollection",
  "features": []
}`;

// wait for the code editor to display the default geojson
const waitForDefaultGeojson = async (page) => {
  await page.waitForFunction(
    (defaultGeoJson) => {
      return window.editor.getValue() === defaultGeoJson;
    },
    defaultGeoJson,
    {
      polling: 500
    }
  );

  return;
};

// wait for the editor to update to something other than the default geojson
const waitForNotDefaultGeojson = async (page) => {
  await page.waitForFunction(
    (defaultGeoJson) => {
      return window.editor.getValue() !== defaultGeoJson;
    },
    defaultGeoJson,
    {
      polling: 500
    }
  );

  return;
};

const getEditorValue = async (page) => {
  await waitForNotDefaultGeojson(page);
  return await page.evaluate(() => window.editor.getValue());
};

// click meta > clear to reset the working geojson to the default
const clearGeojson = async (page) => {
  await page.locator('[data-test=file-bar-parent-meta]').click();
  await page.locator('[data-test=file-bar-child-clear]').click();

  await waitForDefaultGeojson(page);

  return;
};

// click on the map container, takes an array of pixel coordinates ([left, top])
// and clicks them in succession
const clickOnMap = async (coordinates, page) => {
  for (let i = 0; i < coordinates.length; i += 1) {
    const [x, y] = coordinates[i];
    await page.click('#map', {
      position: {
        x,
        y
      }
    });
  }
};

module.exports = {
  waitForDefaultGeojson,
  waitForNotDefaultGeojson,
  getEditorValue,
  clearGeojson,
  clickOnMap
};
