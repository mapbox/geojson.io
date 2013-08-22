var verticalPanel = require('./vertical_panel'),
    gist = require('./gist'),
    github = require('./github'),
    importPanel = require('./import_panel'),
    githubBrowser = require('github-file-browser')(d3),
    detectIndentationStyle = require('detect-json-indent');

module.exports = sourcePanel;

function sourcePanel(updates) {

    function panel(selection) {

        var sources = [
            {
                title: 'Import',
                alt: 'CSV, KML, GPX, and other filetypes',
                icon: 'icon-cog',
                action: clickImport
            },
            {
                title: 'GitHub',
                alt: 'GeoJSON files in GitHub Repositories',
                icon: 'icon-github',
                action: clickGitHub
            },
            {
                title: 'Gist',
                alt: 'GeoJSON files in GitHub Gists',
                icon: 'icon-github-alt',
                action: clickGist
            }
        ];

        selection
            .html('')
            .style('top', window.innerHeight + 'px')
            .classed('hide', false)
            .transition()
            .duration(500)
            .style('top', '40px');

        var $top = selection
            .append('div')
            .attr('class', 'import-sources col12 clearfix');

       var $sources = $top.append('div')
            .attr('class', 'col10')
            .selectAll('div.import-source')
            .data(sources)
            .enter()
            .append('div')
            .attr('class', 'import-source col4')
            .append('div')
            .attr('class', 'pad1 center clickable')
            .attr('title', function(d) { return d.alt; })
            .on('click', clickSource);

        function clickSource(d) {
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
                return 'icon-collapse-top';
            });

        function hidePanel(d) {
            selection
                .transition()
                .duration(500)
                .style('top', window.innerHeight + 'px')
                .each('end', function() {
                    d3.select(this)
                        .html('')
                        .classed('hide', true);
                });
        }

        var $subpane = selection.append('div')
            .attr('class', 'subpane');

        function clickGitHub() {
            $subpane
                .html('')
                .append('div')
                .attr('class', 'repos')
                .call(githubBrowser
                    .gitHubBrowse(localStorage.github_token)
                        .on('chosen', gitHubChosen));

            function gitHubChosen(d) {
                var hash = github.urlHash(d);
                location.hash = hash.url;
                hidePanel();
            }
        }

        function clickImport() {
            $subpane
                .html('')
                .append('div')
                .call(importPanel);

            function gitHubChosen(d) {
                var hash = github.urlHash(d);
                location.hash = hash.url;
                hidePanel();
            }
        }

        function clickGist() {
            $subpane
                .html('')
                .append('div')
                .attr('class', 'browser pad1')
                .call(githubBrowser
                    .gistBrowse(localStorage.github_token)
                        .on('chosen', gistChosen));

            function gistChosen(d) {
                var hash = gist.urlHash(d);
                location.hash = hash.url;
                hidePanel();
            }
        }
    }

    return panel;
}
