import React from 'react';

interface VisualWagonWheelProps {
  shotData: { run: number; angle: number; distance?: number }[];
}

export function VisualWagonWheel({ shotData }: VisualWagonWheelProps) {
  return (
    <div className="flex flex-col items-center">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 self-start">Shot Placement</h4>
      <div className="relative w-48 h-48 bg-green-50 rounded-full border border-green-500 overflow-hidden shadow-sm">
        <svg className="absolute inset-0 w-full h-full">
          {/* Inner Circle */}
          <circle cx="50%" cy="50%" r="30%" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Pitch */}
          <rect x="47%" y="40%" width="6%" height="20%" fill="#d2b48c" />
          
          {/* Shots */}
          {shotData.map((shot, idx) => (
            <line 
              key={idx}
              x1="50%" 
              y1="50%" 
              x2={`${50 + ((shot.distance ?? 100) / 2) * Math.sin(shot.angle * (Math.PI / 180))}%`} 
              y2={`${50 - ((shot.distance ?? 100) / 2) * Math.cos(shot.angle * (Math.PI / 180))}%`} 
              stroke={shot.run === 4 ? '#3b82f6' : shot.run === 6 ? '#8b5cf6' : '#ef4444'} 
              strokeWidth="2"
              opacity="0.8"
            />
          ))}
        </svg>
      </div>
      <div className="flex space-x-3 mt-3 text-[10px] font-bold text-slate-500">
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#ef4444] mr-1"></span> 1s-3s</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#3b82f6] mr-1"></span> 4s</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#8b5cf6] mr-1"></span> 6s</div>
      </div>
    </div>
  );
}
