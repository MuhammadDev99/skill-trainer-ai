// components/PngColorizer.tsx
import React from 'react';

interface PngIconProps {
  src: string;
  color: string;
  className?: string;
}

const PngIcon: React.FC<PngIconProps> = ({ src, color, className }) => {
  return (
    <div
      className={className}
      style={{
        backgroundColor: color,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        // --- ADD THESE DEFAULTS ---
        display: 'inline-block',
        width: '1em',  // Defaults to the size of your text
        height: '1em',
        verticalAlign: 'middle'
      } as React.CSSProperties}
    />
  );
};

export default PngIcon;