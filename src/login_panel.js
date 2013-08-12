var source = require('./source'),
    config = require('./config')(location.hostname);

module.exports = loginPanel;

function loginPanel(container) {
}

loginPanel.init = function(container) {
    var sel = d3.select(container);
    sel.attr('title', 'login to GitHub');
    sel.on('click', login);

    function login() {
        location.href = 'https://github.com/login/oauth/authorize?client_id=' + config.client_id + '&scope=gist,public_repo';
    }

    function logout() {
        analytics.track('Logged Out');
        localStorage.removeItem('github_token');
        sel.attr('title', 'login to GitHub')
            .classed('logged-in', true)
            .on('click', login);
    }

    function killTokenUrl() {
        if (location.href.indexOf('?code') !== -1) location.href = location.href.replace(/\?code=.*$/, '');
    }

    if (location.search && location.search.indexOf('?code') === 0) {
        var code = location.search.replace('?code=', '');
        d3.json(config.gatekeeper_url + '/authenticate/' + code)
            .on('load', function(l) {
                if (l.token) localStorage.github_token = l.token;
                killTokenUrl();
            })
            .on('error', function() {
                analytics.track('GitHub Account / Fail');
                alert('Authentication with GitHub failed');
            })
            .get();
    }

    if (localStorage.github_token) {
        d3.json('https://api.github.com/user')
            .header('Authorization', 'token ' + localStorage.github_token)
            .on('load', function(user) {
                sel
                    .classed('logged-in', true)
                    .attr('title', 'logout')
                    .on('click', logout);
            })
            .on('error', function() {
                sel.classed('logged-in', false);
                localStorage.removeItem('github_token');
            })
            .get();
    }
};
