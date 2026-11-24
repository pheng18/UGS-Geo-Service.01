import React from 'react';

interface UniqTekLogoProps {
  className?: string;
  size?: number | string;
  roundedClassName?: string;
}

export const UniqTekLogo: React.FC<UniqTekLogoProps> = ({
  className = '',
  size = 40,
  roundedClassName = 'rounded-xl'
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center overflow-hidden bg-white shadow-sm select-none shrink-0 ${roundedClassName} ${className}`}
    >
      <img
        src="/assets/aistudio/logo_c1a28654.jpg"
        alt="UNIQTEK Logo"
        className="w-full h-full object-cover"
      />
    </div>
  );
};
