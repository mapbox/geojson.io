module.exports = function(hostname) {
    var production = (hostname === 'geojson.io');

    return {
        client_id: production ?
            '62c753fd0faf18392d85' :
            'bb7bbe70bd1f707125bc',
        gatekeeper_url: production ?
            'http://geojsonioauth.herokuapp.com' :
            'http://localhostauth.herokuapp.com'
    };
};
