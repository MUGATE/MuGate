import React from 'react';

/**
 * Correct Lebanese flag: horizontal red–white–red bands (1:2:1) with a green
 * cedar centered in the white band. Reused by the CV type picker and the builder
 * badge so the flag is consistent everywhere.
 */
const LebanonFlag = ({ width = 28, height = 18, className = '' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 30 20"
    className={className}
    role="img"
    aria-label="Lebanon flag"
  >
    {/* white field */}
    <rect width="30" height="20" fill="#ffffff" />
    {/* red top & bottom bands (each 1/4 of height) */}
    <rect width="30" height="5" fill="#ed1c24" />
    <rect y="15" width="30" height="5" fill="#ed1c24" />
    {/* green cedar in the centre of the white band */}
    <g fill="#007a3d">
      <polygon points="15,6.4 11.6,11 18.4,11" />
      <polygon points="15,8.6 11,13.2 19,13.2" />
      <rect x="14.3" y="12.8" width="1.4" height="1.7" />
    </g>
  </svg>
);

export default LebanonFlag;
