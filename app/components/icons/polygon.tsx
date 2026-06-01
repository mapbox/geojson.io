import type * as React from 'react';

function SvgPolygon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 15 15"
      width="15"
      height="15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 1L12 4L11 11L4 12L1 6L6 1Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SvgPolygon;
