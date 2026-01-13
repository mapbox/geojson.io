import * as E from 'app/components/elements';
import { Suspense, useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Keycap } from './elements';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { DialogHeader } from 'app/components/dialog';

// Utility to extract headings from markdown
function extractHeadings(markdown: string) {
  const lines = markdown.split('\n');
  const headings: { text: string; level: number; id: string }[] = [];
  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      // Generate a slug/id for the heading
      const id = text
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '');
      headings.push({ text, level, id });
    }
  });
  return headings;
}

export default function AboutModal({ open }: { open: boolean }) {
  const [markdown, setMarkdown] = useState<string>('');
  const [headings, setHeadings] = useState<
    { text: string; level: number; id: string }[]
  >([]);
  const headingRefs = useRef<Record<string, HTMLHeadingElement | null>>({});
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      fetch('/next/about.md')
        .then((res) => res.text())
        .then((md) => {
          setMarkdown(md);
          setHeadings(extractHeadings(md));
        })
        .catch(() => setMarkdown('Failed to load info.'));
    }
  }, [open]);

  // Track which heading is in view using scroll position
  useEffect(() => {
    if (!open || headings.length === 0) return;

    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const midpoint = scrollTop + containerHeight / 2;

      const offsets = headings
        .map((h) => {
          const el = headingRefs.current[h.id];
          if (!el) return null;
          // Heading's position relative to scroll container
          const headingTop = el.offsetTop;
          return { id: h.id, headingTop };
        })
        .filter(Boolean) as { id: string; headingTop: number }[];

      // Find the heading closest to but above the midpoint
      const visible = offsets
        .filter((h) => h.headingTop <= midpoint)
        .sort((a, b) => b.headingTop - a.headingTop);

      if (visible.length > 0) {
        setActiveHeading(visible[0].id);
      } else if (offsets.length > 0) {
        // If none above, highlight the first heading
        setActiveHeading(offsets[0].id);
      }
    };

    // Attach scroll listener
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [open, headings, markdown]);

  // Scroll to heading
  const scrollToHeading = (id: string) => {
    const el = headingRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <DialogHeader title="About geojson.io" titleIcon={InfoCircledIcon} />
      {/* Content Area */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <nav className="w-48 flex-shrink-0 pr-2 border-r border-gray-200 dark:border-gray-800">
          <ul className="">
            {headings.map((h) => (
              <li key={h.id} style={{ marginLeft: h.level === 3 ? 12 : 0 }}>
                <button
                  className={`text-left text-sm focus:outline-none transition ${
                    activeHeading === h.id
                      ? 'text-mb-blue-700'
                      : 'text-gray-500 hover:text-mb-blue-700'
                  }`}
                  onClick={() => scrollToHeading(h.id)}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* Markdown Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div
            ref={contentRef}
            className="overflow-y-auto flex-1 min-h-0 text-sm placemark-scrollbar break-words [overflow-wrap:anywhere] leading-7"
          >
            <Suspense fallback={<E.Loading size="sm" />}>
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => {
                    const id =
                      typeof props.children === 'string'
                        ? props.children
                            .toLowerCase()
                            .replace(/[^\w]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                        : undefined;
                    return (
                      <h1
                        id={id}
                        ref={(el) => {
                          if (id) headingRefs.current[id] = el;
                        }}
                        className="text-2xl font-bold mt-4 mb-2"
                        {...props}
                      />
                    );
                  },
                  h2: ({ node, ...props }) => {
                    const id =
                      typeof props.children === 'string'
                        ? props.children
                            .toLowerCase()
                            .replace(/[^\w]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                        : undefined;
                    return (
                      <h2
                        id={id}
                        ref={(el) => {
                          if (id) headingRefs.current[id] = el;
                        }}
                        className="text-lg font-semibold mt-4 mb-2"
                        {...props}
                      />
                    );
                  },
                  h3: ({ node, ...props }) => {
                    const id =
                      typeof props.children === 'string'
                        ? props.children
                            .toLowerCase()
                            .replace(/[^\w]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                        : undefined;
                    return (
                      <h3
                        id={id}
                        ref={(el) => {
                          if (id) headingRefs.current[id] = el;
                        }}
                        className="text-md font-semibold mt-3 mb-1"
                        {...props}
                      />
                    );
                  },
                  // ...existing markdown components...
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 mb-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="mb-1" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="text-mb-blue-500 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm"
                      {...props}
                    />
                  ),
                  pre: ({ node, ...props }) => (
                    <pre
                      className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 overflow-x-auto"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2"
                      {...props}
                    />
                  ),
                  kbd: ({ node, children, ...props }) => (
                    <Keycap size="xs">{children}</Keycap>
                  ),
                  table: ({ node, ...props }) => (
                    <table
                      className="min-w-full border border-gray-300 my-4 text-sm"
                      {...props}
                    />
                  ),
                  thead: ({ node, ...props }) => (
                    <thead
                      className="bg-gray-100 dark:bg-gray-800"
                      {...props}
                    />
                  ),
                  tbody: ({ node, ...props }) => <tbody {...props} />,
                  tr: ({ node, ...props }) => (
                    <tr
                      className="border-b border-gray-200 dark:border-gray-700"
                      {...props}
                    />
                  ),
                  th: ({ node, ...props }) => (
                    <th
                      className="px-3 py-2 text-left font-semibold"
                      {...props}
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-3 py-2 align-top" {...props} />
                  )
                }}
              >
                {markdown}
              </ReactMarkdown>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
