module.exports = function(hostname) {
    // Settings for geojson.io
    L.mapbox.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlpIdEpjOHcifQ.Cldl4wq_T5KOgxhLvbjE-w';
    if (hostname === 'geojson.io') {
        return {
            client_id: '62c753fd0faf18392d85',
            gatekeeper_url: 'https://geojsonioauth.herokuapp.com'
        };
    // Customize these settings for your own development/deployment
    // version of geojson.io.
    } else {
        L.mapbox.config.HTTP_URL = 'http://a.tiles.mapbox.com/v4';
        L.mapbox.config.HTTPS_URL = 'https://a.tiles.mapbox.com/v4';
        L.mapbox.config.FORCE_HTTPS = true;
        L.mapbox.config.REQUIRE_ACCESS_TOKEN = true;
        return {
            GithubAPI: null,
            client_id: 'bb7bbe70bd1f707125bc',
            gatekeeper_url: 'https://localhostauth.herokuapp.com'
        };
    }
};
