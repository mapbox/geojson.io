var production = (location.hostname === 'geojson.io');

var client_id = production ?
    '62c753fd0faf18392d85' :
    'bb7bbe70bd1f707125bc';

var gatekeeper_url = production ?
    'http://geojsonioauth.herokuapp.com' :
    'http://localhostauth.herokuapp.com';
