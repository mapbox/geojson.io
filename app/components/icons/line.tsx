import type * as React from 'react';

function SvgLine(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      {...props}
    >
      <path
        d="M13 2L10 7L5 8L2 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SvgLine;
