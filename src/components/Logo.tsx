import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div 
        className="relative flex items-center justify-center overflow-hidden rounded-lg bg-black shadow-lg"
        style={{ width: size, height: size }}
      >
        {/* Border rings */}
        <div className="absolute inset-0 border-[1.5px] border-white/20 rounded-lg"></div>
        <div className="absolute inset-[2px] border-[1px] border-red-500/40 rounded-lg"></div>
        
        {/* Main Logo Content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
            style={{ width: size * 0.7, height: size * 0.7 }}
          >
            <path d="M6 18.2V21a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2.8a2 2 0 0 0-1-1.73l-2.12-1.22a2 2 0 0 1-1-1.73V11" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        
        {/* Fallback for actual image */}
        <img 
          src="/logo.png" 
          alt="Streamlify" 
          className="absolute inset-0 w-full h-full object-cover z-20 opacity-0 transition-opacity duration-300" 
          onLoad={(e) => (e.currentTarget.style.opacity = '1')}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>
      <span className="font-black tracking-tighter text-inherit" style={{ fontSize: size * 0.65 }}>
        STREAMLIFY
      </span>
    </div>
  );
};
