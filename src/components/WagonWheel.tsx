import React, { useState } from 'react';
import { X } from 'lucide-react';

interface WagonWheelProps {
  run: number;
  onSave: (run: number, angle: number, distance: number) => void;
  onClose: () => void;
}

export function WagonWheel({ run, onSave, onClose }: WagonWheelProps) {
  const [selectedAngle, setSelectedAngle] = useState<number | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    
    // Calculate angle in degrees (0 is top, 90 is right, etc)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    setSelectedAngle(angle);
    
    const maxRadius = rect.width / 2;
    const rawDistance = Math.sqrt(x * x + y * y);
    const distance = Math.min(100, (rawDistance / maxRadius) * 100);
    setSelectedDistance(distance);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Select Shot Direction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex flex-col items-center">
          <p className="text-sm text-slate-500 mb-4 text-center">
            Tap on the ground to record where the {run} {run === 1 ? 'run was' : 'runs were'} scored.
          </p>
          <div className="relative w-64 h-64 bg-green-100 rounded-full border-2 border-green-500 overflow-hidden shadow-inner">
            <svg 
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onClick={handleClick}
            >
              {/* Inner Circle */}
              <circle cx="50%" cy="50%" r="30%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 4" />
              {/* Pitch */}
              <rect x="46%" y="40%" width="8%" height="20%" fill="#d2b48c" />
              {/* Stumps */}
              <line x1="50%" y1="40%" x2="50%" y2="42%" stroke="white" strokeWidth="2" />
              <line x1="50%" y1="58%" x2="50%" y2="60%" stroke="white" strokeWidth="2" />
              
              {/* Plot selected angle */}
              {selectedAngle !== null && selectedDistance !== null && (
                <g>
                  <line 
                    x1="50%" 
                    y1="50%" 
                    x2={`${50 + (selectedDistance / 2) * Math.sin(selectedAngle * (Math.PI / 180))}%`} 
                    y2={`${50 - (selectedDistance / 2) * Math.cos(selectedAngle * (Math.PI / 180))}%`} 
                    stroke={run === 4 ? '#3b82f6' : run === 6 ? '#8b5cf6' : '#ef4444'} 
                    strokeWidth="3"
                  />
                  <circle
                    cx={`${50 + (selectedDistance / 2) * Math.sin(selectedAngle * (Math.PI / 180))}%`}
                    cy={`${50 - (selectedDistance / 2) * Math.cos(selectedAngle * (Math.PI / 180))}%`}
                    r="4"
                    fill={run === 4 ? '#3b82f6' : run === 6 ? '#8b5cf6' : '#ef4444'}
                  />
                </g>
              )}
            </svg>
          </div>
          
          <button 
            onClick={() => selectedAngle !== null && onSave(run, selectedAngle, selectedDistance!)}
            disabled={selectedAngle === null}
            className="mt-6 w-full py-3 bg-[#d11a2a] text-white rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            Save Shot
          </button>
        </div>
      </div>
    </div>
  );
}
