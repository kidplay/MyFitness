import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  onClick,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg',
    sm: 'w-7 h-7 sm:w-8 sm:h-8 rounded-xl',
    md: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl',
    lg: 'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl',
    xl: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
  };

  const content = (
    <>
      <div
        className={`${sizeClasses[size]} overflow-hidden flex-shrink-0 border border-neutral-700/80 bg-neutral-900 shadow-[0_0_12px_rgba(244,63,94,0.25)] relative group`}
      >
        <img
          src="/src/assets/images/app_logo_1790696330868.jpg"
          alt="MyFitness Logo"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white truncate">
              MyFitness
            </span>
            <span className="hidden xs:inline text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-neutral-800 text-emerald-400 border border-neutral-700">
              MVP
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 hidden sm:block truncate">
            Track Food · Train · Progress
          </p>
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Go to Today (Home)"
        className={`flex items-center gap-2 sm:gap-2.5 min-w-0 flex-shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 min-w-0 flex-shrink-0 ${className}`}>
      {content}
    </div>
  );
};
