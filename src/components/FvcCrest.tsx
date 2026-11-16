import React from 'react';

interface FvcCrestProps {
  size?: number;
  className?: string;
}

export const FvcCrest: React.FC<FvcCrestProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Future Vision Capital Crest"
    >
      <defs>
        <linearGradient id="fvcGoldRing" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F1CE7C" />
          <stop offset="50%" stopColor="#D6A84B" />
          <stop offset="100%" stopColor="#9E7422" />
        </linearGradient>
        <linearGradient id="fvcNavyCore" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#163250" />
          <stop offset="100%" stopColor="#0A1828" />
        </linearGradient>
      </defs>
      {/* Outer Gold Emblem Ring */}
      <circle cx="32" cy="32" r="30" fill="url(#fvcNavyCore)" stroke="url(#fvcGoldRing)" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="25.5" stroke="#D6A84B" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 2" />
      {/* Shield Crest */}
      <path
        d="M32 13L46 18.5V31.5C46 40.4 40 47.4 32 51C24 47.4 18 40.4 18 31.5V18.5L32 13Z"
        fill="#0F2338"
        stroke="url(#fvcGoldRing)"
        strokeWidth="1.8"
      />
      {/* Rising Chart / Vision Pillar inside Shield */}
      <path d="M24 37L29 31L33 34.5L40 25" stroke="#087F68" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36.5 25H40V28.5" stroke="#D6A84B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Monogram FVC */}
      <text
        x="32"
        y="44.5"
        textAnchor="middle"
        fill="#F1CE7C"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="Plus Jakarta Sans, sans-serif"
        letterSpacing="0.8"
      >
        FVC
      </text>
      {/* Crown Star at Apex */}
      <circle cx="32" cy="10.2" r="1.8" fill="#F1CE7C" />
    </svg>
  );
};
