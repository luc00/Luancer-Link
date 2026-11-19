import React from 'react';

interface LuancerLogoProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
  className?: string;
}

export function LuancerLogo({
  variant = 'light',
  compact = false,
  className = '',
}: LuancerLogoProps) {
  const boxClass = compact ? 'h-[48px] w-[96px]' : 'h-[54px] w-[106px]';
  const imgClass = compact ? 'w-[132px] h-[108px]' : 'w-[148px] h-[121px]';

  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden select-none shrink-0 ${boxClass} ${className}`}
    >
      <img
        src="/assets/aistudio/logo_LUANCER_d035bfad.PNG"
        alt="Luancer and Co."
        draggable={false}
        className={`${imgClass} max-w-none shrink-0 object-contain ${
          variant === 'dark'
            ? 'brightness-[1.2] contrast-[1.3] invert hue-rotate-180 mix-blend-screen'
            : 'brightness-[1.18] contrast-[1.25] mix-blend-multiply'
        }`}
      />
    </span>
  );
}
