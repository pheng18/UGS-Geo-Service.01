import React from 'react';

/**
 * High-precision SVG data URLs faithfully reproducing the uploaded
 * `station_open.png` (Online - Green 3D GNSS Monument) and
 * `station_close.png` (Offline - Red 3D GNSS Monument) icons from
 * http://183.182.105.253/index.aspx
 */
const STATION_OPEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 180" width="64" height="180">
  <defs>
    <!-- Body horizontal cylindrical gradient (Green with bright white center core) -->
    <linearGradient id="openBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#003d00"/>
      <stop offset="8%" stop-color="#008a00"/>
      <stop offset="22%" stop-color="#00b800"/>
      <stop offset="38%" stop-color="#7aff7a"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="62%" stop-color="#7aff7a"/>
      <stop offset="78%" stop-color="#00b800"/>
      <stop offset="92%" stop-color="#008a00"/>
      <stop offset="100%" stop-color="#003d00"/>
    </linearGradient>

    <!-- Top dome radial gradient -->
    <radialGradient id="openDomeGrad" cx="50%" cy="42%" r="52%" fx="50%" fy="38%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="28%" stop-color="#a8ffa8"/>
      <stop offset="58%" stop-color="#00c400"/>
      <stop offset="85%" stop-color="#008000"/>
      <stop offset="100%" stop-color="#003d00"/>
    </radialGradient>

    <!-- Mid collar horizontal highlight -->
    <radialGradient id="openCollarGrad" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#8cff8c"/>
      <stop offset="70%" stop-color="#00a800"/>
      <stop offset="100%" stop-color="#004400"/>
    </radialGradient>

    <!-- Upper T-flare reflection under collar -->
    <radialGradient id="openTopFlare" cx="50%" cy="15%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#00b800" stop-opacity="0"/>
    </radialGradient>

    <filter id="openBlur" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
  </defs>

  <!-- Stepped Top Cap / Antenna Finial -->
  <rect x="20" y="2" width="24" height="5" rx="2" fill="#009900" stroke="#004d00" stroke-width="1"/>
  <rect x="12" y="6" width="40" height="6" rx="2.5" fill="#007700" stroke="#003800" stroke-width="1"/>

  <!-- Upper GNSS Radome Dome -->
  <path d="M6,14 C6,9 14,7 32,7 C50,7 58,9 58,14 L60,36 C60,41 48,44 32,44 C16,44 4,41 4,36 Z" fill="url(#openDomeGrad)" stroke="#004200" stroke-width="1.5"/>

  <!-- Collar Groove & Side Notches -->
  <path d="M4,37 Q32,43 60,37 L60,43 Q32,48 4,43 Z" fill="#002b00"/>
  <polygon points="5,36 16,40 5,44" fill="#001400"/>
  <polygon points="59,36 48,40 59,44" fill="#001400"/>

  <!-- Lower Radome Collar Ring with Specular Highlight -->
  <path d="M4,43 C16,46 48,46 60,43 L61,54 C48,61 16,61 3,54 Z" fill="url(#openCollarGrad)" stroke="#003d00" stroke-width="1.2"/>
  <ellipse cx="32" cy="49" rx="14" ry="4.5" fill="#ffffff" filter="url(#openBlur)"/>

  <!-- Dark Neck Ring Separator -->
  <path d="M4,54 C18,62 46,62 60,54 L59,60 C46,67 18,67 5,60 Z" fill="#005500"/>
  <path d="M14,58 C24,63 40,63 50,58 L46,64 C38,67 26,67 18,64 Z" fill="#003300"/>

  <!-- Main Cylindrical Monument Body -->
  <rect x="4" y="60" width="56" height="106" rx="3" fill="url(#openBodyGrad)" stroke="#004200" stroke-width="1.5"/>

  <!-- T-Shaped Top Specular Reflection under Collar -->
  <ellipse cx="32" cy="68" rx="18" ry="5" fill="#ffffff" filter="url(#openBlur)"/>
  <rect x="25" y="66" width="14" height="96" rx="6" fill="#ffffff" opacity="0.92" filter="url(#openBlur)"/>

  <!-- Bottom Left Status LED (Cyan + Dark Green as in station_open.png) -->
  <circle cx="14" cy="150" r="4" fill="#00e5ff" filter="url(#openBlur)"/>
  <circle cx="14" cy="155" r="3.5" fill="#006600"/>

  <!-- Bottom Right Status LED (Bright Green) -->
  <circle cx="47" cy="154" r="4" fill="#00b800" filter="url(#openBlur)"/>

  <!-- Stepped Monument Pedestal Base -->
  <rect x="2" y="163" width="60" height="6" rx="2" fill="url(#openBodyGrad)" stroke="#003d00" stroke-width="1.2"/>
  <rect x="9" y="169" width="46" height="5" rx="1.5" fill="url(#openBodyGrad)" stroke="#003d00" stroke-width="1.2"/>
  <rect x="18" y="174" width="28" height="4" rx="1" fill="#009900" stroke="#003d00" stroke-width="1"/>
</svg>`;

const STATION_CLOSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 180" width="64" height="180">
  <defs>
    <!-- Body horizontal cylindrical gradient (Red with bright white center core) -->
    <linearGradient id="closeBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4d0000"/>
      <stop offset="8%" stop-color="#b30000"/>
      <stop offset="22%" stop-color="#e60000"/>
      <stop offset="38%" stop-color="#ff8080"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="62%" stop-color="#ff8080"/>
      <stop offset="78%" stop-color="#e60000"/>
      <stop offset="92%" stop-color="#b30000"/>
      <stop offset="100%" stop-color="#4d0000"/>
    </linearGradient>

    <!-- Top dome radial gradient -->
    <radialGradient id="closeDomeGrad" cx="50%" cy="42%" r="52%" fx="50%" fy="38%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="28%" stop-color="#ffb3b3"/>
      <stop offset="58%" stop-color="#f00000"/>
      <stop offset="85%" stop-color="#a80000"/>
      <stop offset="100%" stop-color="#4d0000"/>
    </radialGradient>

    <!-- Mid collar horizontal highlight -->
    <radialGradient id="closeCollarGrad" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#ff9999"/>
      <stop offset="70%" stop-color="#d90000"/>
      <stop offset="100%" stop-color="#590000"/>
    </radialGradient>

    <filter id="closeBlur" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
  </defs>

  <!-- Stepped Top Cap / Antenna Finial -->
  <rect x="20" y="2" width="24" height="5" rx="2" fill="#cc0000" stroke="#660000" stroke-width="1"/>
  <rect x="12" y="6" width="40" height="6" rx="2.5" fill="#990000" stroke="#4d0000" stroke-width="1"/>

  <!-- Upper GNSS Radome Dome -->
  <path d="M6,14 C6,9 14,7 32,7 C50,7 58,9 58,14 L60,36 C60,41 48,44 32,44 C16,44 4,41 4,36 Z" fill="url(#closeDomeGrad)" stroke="#590000" stroke-width="1.5"/>

  <!-- Collar Groove & Side Notches -->
  <path d="M4,37 Q32,43 60,37 L60,43 Q32,48 4,43 Z" fill="#3b0000"/>
  <polygon points="5,36 16,40 5,44" fill="#1f0000"/>
  <polygon points="59,36 48,40 59,44" fill="#1f0000"/>

  <!-- Lower Radome Collar Ring with Specular Highlight -->
  <path d="M4,43 C16,46 48,46 60,43 L61,54 C48,61 16,61 3,54 Z" fill="url(#closeCollarGrad)" stroke="#590000" stroke-width="1.2"/>
  <ellipse cx="32" cy="49" rx="14" ry="4.5" fill="#ffffff" filter="url(#closeBlur)"/>

  <!-- Dark Neck Ring Separator -->
  <path d="M4,54 C18,62 46,62 60,54 L59,60 C46,67 18,67 5,60 Z" fill="#800000"/>
  <path d="M14,58 C24,63 40,63 50,58 L46,64 C38,67 26,67 18,64 Z" fill="#4d0000"/>

  <!-- Main Cylindrical Monument Body -->
  <rect x="4" y="60" width="56" height="106" rx="3" fill="url(#closeBodyGrad)" stroke="#590000" stroke-width="1.5"/>

  <!-- T-Shaped Top Specular Reflection under Collar -->
  <ellipse cx="32" cy="68" rx="18" ry="5" fill="#ffffff" filter="url(#closeBlur)"/>
  <rect x="25" y="66" width="14" height="96" rx="6" fill="#ffffff" opacity="0.92" filter="url(#closeBlur)"/>

  <!-- Bottom Left Status LED (Magenta/Pink + Dark Red as in station_close.png) -->
  <circle cx="14" cy="150" r="4" fill="#ff33aa" filter="url(#closeBlur)"/>
  <circle cx="14" cy="155" r="3.5" fill="#990000"/>

  <!-- Bottom Right Status LED (Red) -->
  <circle cx="47" cy="154" r="4" fill="#ff1a1a" filter="url(#closeBlur)"/>

  <!-- Stepped Monument Pedestal Base -->
  <rect x="2" y="163" width="60" height="6" rx="2" fill="url(#closeBodyGrad)" stroke="#590000" stroke-width="1.2"/>
  <rect x="9" y="169" width="46" height="5" rx="1.5" fill="url(#closeBodyGrad)" stroke="#590000" stroke-width="1.2"/>
  <rect x="18" y="174" width="28" height="4" rx="1" fill="#cc0000" stroke="#590000" stroke-width="1"/>
</svg>`;

export const STATION_OPEN_IMG_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(STATION_OPEN_SVG)}`;
export const STATION_CLOSE_IMG_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(STATION_CLOSE_SVG)}`;

interface CorsStationIconProps {
  status: 'Online' | 'Offline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'map';
  className?: string;
  showPulse?: boolean;
}

export const CorsStationIcon: React.FC<CorsStationIconProps> = ({
  status,
  size = 'md',
  className = '',
  showPulse = false
}) => {
  const isOnline = status === 'Online';
  const src = isOnline ? STATION_OPEN_IMG_SRC : STATION_CLOSE_IMG_SRC;
  const alt = isOnline ? 'station_open.png (CORS Online)' : 'station_close.png (CORS Offline)';

  const sizeClasses: Record<NonNullable<CorsStationIconProps['size']>, string> = {
    xs: 'w-2.5 h-7',
    sm: 'w-3.5 h-9',
    md: 'w-4 h-11',
    lg: 'w-5 h-14',
    map: 'w-4 h-10'
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {showPulse && (
        <span
          className={`absolute -inset-1 rounded-full blur-xs opacity-40 animate-pulse pointer-events-none ${
            isOnline ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
      )}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`${sizeClasses[size]} object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-transform`}
      />
    </div>
  );
};
