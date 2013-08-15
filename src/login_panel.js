'use strict';

var source = require('./source'),
    config = require('./config')(location.hostname);

module.exports = loginPanel;

function loginPanel(container) {
}

loginPanel.init = function(container) {
    var sel = d3.select(container);
    sel.on('click', login);

    function login() {
        window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + config.client_id + '&scope=gist,public_repo';
    }

    function logout() {
        window.localStorage.removeItem('github_token');
        sel.classed('logged-in', true)
            .on('click', login);
    }

    function killTokenUrl() {
        if (window.location.href.indexOf('?code') !== -1) {
            window.location.href = window.location.href.replace(/\?code=.*$/, '');
        }
    }

    if (window.location.search && window.location.search.indexOf('?code') === 0) {
        var code = window.location.search.replace('?code=', '');
        d3.json(config.gatekeeper_url + '/authenticate/' + code)
            .on('load', function(l) {
                if (l.token) window.localStorage.github_token = l.token;
                killTokenUrl();
            })
            .on('error', function() {
                alert('Authentication with GitHub failed');
            })
            .get();
    }

    if (localStorage.github_token) {
        d3.json('https://api.github.com/user')
            .header('Authorization', 'token ' + window.localStorage.github_token)
            .on('load', function(user) {
                localStorage.github_user = JSON.stringify(user);
                sel
                    .style('background-image', 'url(' + user.avatar_url + ')')
                    .style('background-size', '40px 40px')
                    .style('background-repeat', 'no-repeat')
                    .on('click', logout);
            })
            .on('error', function() {
                window.localStorage.removeItem('github_token');
            })
            .get();
    }
};
