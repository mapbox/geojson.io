import changelogMarkdown from '../CHANGELOG.md?raw';

const RECENT_ENTRY_COUNT = 5;
const FULL_CHANGELOG_URL =
  'https://github.com/mapbox/geojson.io/blob/main/next/CHANGELOG.md';

// Reformats the standalone CHANGELOG.md to embed cleanly in the About modal:
// keep the most recent N date entries, demote each date heading to inline
// bold text so the sidebar nav stays tidy, prepend a "What's new" heading,
// and link out to the full changelog on GitHub.
export const changelogForAboutModal: string = (() => {
  const sections = changelogMarkdown.split(/(?=^##\s+\d{4}-\d{2}-\d{2})/m);
  const dated = sections.filter((s) => /^##\s+\d{4}-\d{2}-\d{2}/.test(s));
  const recent = dated
    .slice(0, RECENT_ENTRY_COUNT)
    .join('')
    .replace(/^##\s+(\d{4}-\d{2}-\d{2})\s*$/gm, '**$1**')
    .trim();
  return `## What's new\n\n${recent}\n\n[View full changelog on GitHub →](${FULL_CHANGELOG_URL})\n`;
})();
