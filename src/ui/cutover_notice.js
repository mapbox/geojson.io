const modal = require('./modal');

const DISMISS_KEY = 'cutover_notice_dismissed_v1';
const DISMISS_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const NEXT_URL = '/next';
const ISSUES_URL = 'https://github.com/mapbox/geojson.io/issues';
const CHANGELOG_URL =
  'https://github.com/mapbox/geojson.io/blob/main/next/CHANGELOG.md';

module.exports = function (context) {
  const dismissedAt = context.storage.get(DISMISS_KEY);
  if (
    typeof dismissedAt === 'number' &&
    Date.now() - dismissedAt < DISMISS_TTL_MS
  )
    return;

  const m = modal(d3.select('div.geojsonio'));
  const content = m.select('.content');

  content
    .append('div')
    .attr('class', 'header pad2 fillD')
    .append('h1')
    .text('Heads up: geojson.io is changing');

  const body = content.append('div').attr('class', 'pad2');

  body
    .append('p')
    .html(
      'On <strong>June 1st</strong>, the new geojson.io (currently at ' +
        '<a href="' +
        NEXT_URL +
        '" target="_blank" class="underline">/next</a>) ' +
        'will replace this version.'
    );

  body
    .append('p')
    .html(
      "We've been actively incorporating feedback from users — " +
        '<a href="' +
        CHANGELOG_URL +
        '" target="_blank" rel="noopener" class="underline">' +
        "see what's changed</a> in the new version."
    );

  body
    .append('p')
    .html(
      'Found a bug or have feedback on the new version? Please ' +
        '<a href="' +
        ISSUES_URL +
        '" target="_blank" rel="noopener" class="underline">' +
        'file an issue on GitHub</a>.'
    );

  const actions = body.append('div').attr('class', 'flex gap-2 mt-4');

  actions
    .append('a')
    .attr('href', NEXT_URL)
    .attr('target', '_blank')
    .attr(
      'class',
      'bg-pink hover:bg-pink-dark text-white text-sm font-bold py-2 px-4 rounded inline-flex items-center gap-2 no-underline'
    )
    .html('Try the new geojson.io <span>&rarr;</span>');

  actions
    .append('a')
    .attr('href', ISSUES_URL)
    .attr('target', '_blank')
    .attr('rel', 'noopener')
    .attr(
      'class',
      'bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold py-2 px-4 rounded inline-flex items-center no-underline'
    )
    .text('File an issue on GitHub');

  // Persist dismissal regardless of how the modal is closed (X, backdrop, ESC).
  const baseClose = m.close;
  m.close = function () {
    context.storage.set(DISMISS_KEY, Date.now());
    baseClose.call(m);
  };
};
