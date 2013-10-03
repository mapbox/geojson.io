var importPanel = require('./import'),
    githubBrowser = require('github-file-browser')(d3),
    qs = require('../lib/querystring'),
    detectIndentationStyle = require('detect-json-indent');

module.exports = function(context) {

    function render(selection) {

        selection
            .select('.right.overlay').remove();

        var panel = selection
            .append('div')
            .attr('class', 'right overlay');

        var sources = [{
            title: 'Import',
            alt: 'CSV, KML, GPX, and other filetypes',
            icon: 'icon-cog',
            action: clickImport
        }, {
            title: 'GitHub',
            alt: 'GeoJSON files in GitHub Repositories',
            icon: 'icon-github',
            authenticated: true,
            action: clickGitHub
        }, {
            title: 'Gist',
            alt: 'GeoJSON files in GitHub Gists',
            icon: 'icon-github-alt',
            authenticated: true,
            action: clickGist
        }];

        var $top = panel
            .append('div')
            .attr('class', 'top');

       var $buttons = $top.append('div')
            .attr('class', 'buttons');

       var $sources = $buttons
           .selectAll('button.source')
            .data(sources)
            .enter()
            .append('button')
            .classed('deemphasize', function(d) {
                return d.authenticated && !context.user.token();
            })
            .attr('class', function(d) {
                return d.icon + ' icon-spaced pad1 source';
            })
            .text(function(d) {
                return ' ' + d.title;
            })
            .attr('title', function(d) { return d.alt; })
            .on('click', clickSource);

        function clickSource(d) {
            if (d.authenticated && !context.user.token()) {
                return alert('Log in to load GitHub files and Gists');
            }

            var that = this;
            $sources.classed('active', function() {
                return that === this;
            });

            d.action.apply(this, d);
        }

        $buttons.append('button')
            .on('click', hidePanel)
            .attr('class', function(d) {
                return 'icon-remove';
            });

        function hidePanel(d) {
            panel.remove();
        }

        var $subpane = panel.append('div')
            .attr('class', 'subpane');

        function clickGitHub() {
            $subpane
                .html('')
                .append('div')
                .attr('class', 'repos')
                .call(githubBrowser
                    .gitHubBrowse(context.user.token(), {
                        sort: function(a, b) {
                            return new Date(b.pushed_at) - new Date(a.pushed_at);
                        }
                    }).on('chosen', context.data.parse));
        }

        function clickImport() {
            $subpane
                .html('')
                .append('div')
                .call(importPanel(context));
        }

        function clickGist() {
            $subpane
                .html('')
                .append('div')
                .attr('class', 'browser pad1')
                .call(githubBrowser
                    .gistBrowse(context.user.token(), {
                        sort: function(a, b) {
                            return new Date(b.updated_at) - new Date(a.updated_at);
                        }
                    }).on('chosen', function(d) {
                        var login = (d.user && d.user.login) || 'anonymous',
                            path = 'gist:' + [login, d.id].join('/'),
                            oldPath = qs.stringQs(location.hash.split('#')[1]).id;
                        if (oldPath != path) context.data.parse(d);
                    }));
        }

        $sources.filter(function(d, i) { return !i; }).trigger('click');
    }

    return render;
};
