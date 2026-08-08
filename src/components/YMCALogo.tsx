import React, { useState, useEffect } from 'react';
import { getITSystemConfig } from '../utils/deviceManager';

interface YMCALogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  subtext?: string;
  customLogoUrl?: string;
}

export const YMCALogo: React.FC<YMCALogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textClassName = 'text-white font-black',
  subtext,
  customLogoUrl,
}) => {
  const [logoUrl, setLogoUrl] = useState<string>(() => customLogoUrl || getITSystemConfig().logoUrl || '');

  useEffect(() => {
    if (customLogoUrl !== undefined) {
      setLogoUrl(customLogoUrl);
      return;
    }

    const updateLogo = () => {
      const cfg = getITSystemConfig();
      setLogoUrl(cfg.logoUrl || '');
    };

    updateLogo();
    window.addEventListener('geofence_device_update', updateLogo);
    return () => window.removeEventListener('geofence_device_update', updateLogo);
  }, [customLogoUrl]);

  const sizeDimensions = {
    sm: { box: 'w-7 h-7', icon: 'w-5 h-5', text: 'text-sm' },
    md: { box: 'w-10 h-10', icon: 'w-7 h-7', text: 'text-base' },
    lg: { box: 'w-12 h-12', icon: 'w-8 h-8', text: 'text-xl' },
    xl: { box: 'w-16 h-16', icon: 'w-11 h-11', text: 'text-2xl' },
  };

  const dim = sizeDimensions[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* YMCA Red Triangle Iconic Emblem or IT Custom Logo */}
      <div
        className={`relative ${dim.box} rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 p-0.5 flex items-center justify-center shadow-lg shadow-red-600/30 border border-red-400/40 transform hover:scale-105 transition-transform overflow-hidden`}
        title="YMCA - Young Men's Christian Association"
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="YMCA Custom Logo"
            className="w-full h-full object-cover rounded-lg"
            onError={() => setLogoUrl('')}
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            className={`${dim.icon} text-white drop-shadow-md fill-current`}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Classic YMCA Red Triangle & Stylized Y Emblem */}
            <polygon points="50,10 90,85 10,85" fill="#DC2626" />
            <polygon points="50,22 80,78 20,78" fill="#FFFFFF" opacity="0.95" />
            <path
              d="M 32 32 L 50 54 L 68 32 L 80 32 L 57 60 L 57 78 L 43 78 L 43 60 L 20 32 Z"
              fill="#B91C1C"
            />
            <rect x="15" y="48" width="70" height="10" fill="#DC2626" rx="2" />
            <text
              x="50"
              y="56"
              fontSize="8"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill="#FFFFFF"
              textAnchor="middle"
              letterSpacing="1.5"
            >
              YMCA
            </text>
          </svg>
        )}
      </div>

      {/* Optional YMCA Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center space-x-1.5">
            <span className={`tracking-tight ${dim.text} ${textClassName}`}>
              YMCA
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 font-bold border border-red-500/30">
              Ga-Rankuwa
            </span>
          </div>
          {subtext && (
            <span className="text-[11px] text-slate-400 font-medium mt-1">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
