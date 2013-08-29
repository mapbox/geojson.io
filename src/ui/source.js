var gist = require('../source/gist'),
    github = require('../source/github'),
    importPanel = require('./import'),
    githubBrowser = require('github-file-browser')(d3),
    detectIndentationStyle = require('detect-json-indent');

module.exports = function(context) {

    function render(selection) {

        selection.select('.right.overlay').remove();

        var panel = selection.append('div')
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
            .attr('class', 'import-sources col12 clearfix');

       var $sources = $top.append('div')
            .attr('class', 'col10')
            .selectAll('div.import-source')
            .data(sources)
            .enter()
            .append('div')
            .attr('class', 'import-source col4')
            .classed('deemphasize', function(d) {
                return d.authenticated && !context.user.token();
            })
            .append('div')
            .attr('class', 'pad1 center clickable')
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

        $sources.append('span')
            .attr('class', function(d) {
                return d.icon + ' icon-spaced';
            });

        $sources.append('span')
            .attr('class', 'label')
            .text(function(d) {
                return d.title;
            });

        $top.append('div')
            .attr('class', 'col2')
            .append('div')
            .attr('class', 'pad1 center clickable')
            .on('click', hidePanel)
            .append('span')
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
                    .gitHubBrowse(context.user.token())
                        .on('chosen', context.data.load));
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
                    .gistBrowse(context.user.token())
                        .on('chosen', context.data.load));
        }

        $sources.filter(function(d, i) { return !i; }).trigger('click');
    }

    return render;
};
