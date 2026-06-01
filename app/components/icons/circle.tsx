import type * as React from 'react';

function SvgCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 15 15"
      width="15"
      height="15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle r="6.5" stroke="currentColor" cx="7.5" cy="7.5" />
    </svg>
  );
}

export default SvgCircle;
