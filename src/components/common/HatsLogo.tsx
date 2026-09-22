import React from 'react';

interface HatsLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const HatsLogo: React.FC<HatsLogoProps> = ({ size = 32, className = '', showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 128 128" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="hats-app-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0A84FF" />
            <stop offset="50%" stopColor="#8A42DB" />
            <stop offset="100%" stopColor="#FF375F" />
          </linearGradient>
          <linearGradient id="hats-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>
          <filter id="hats-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect x="8" y="8" width="112" height="112" rx="28" fill="#0B0D14" stroke="url(#hats-rim-grad)" strokeWidth="2.5" />

        <rect x="36" y="28" width="56" height="46" rx="10" fill="url(#hats-app-grad)" filter="url(#hats-glow)" />
        
        <rect x="36" y="62" width="56" height="12" rx="2" fill="#FFD60A" />

        <ellipse cx="64" cy="74" rx="42" ry="10" fill="url(#hats-app-grad)" />

        <circle cx="48" cy="42" r="4.5" fill="#66D4CF" />
        <circle cx="64" cy="38" r="4.5" fill="#FF9F0A" />
        <circle cx="80" cy="42" r="4.5" fill="#32D74B" />

        <path d="M 94 20 L 96 26 L 102 28 L 96 30 L 94 36 L 92 30 L 86 28 L 92 26 Z" fill="#FFFFFF" opacity="0.95" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="leading-none font-extrabold text-base tracking-tight text-white">HATS</span>
          <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Home Assistant Theme Store</span>
        </div>
      )}
    </div>
  );
};
