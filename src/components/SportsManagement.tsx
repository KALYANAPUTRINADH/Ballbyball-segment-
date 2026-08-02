import React from 'react';
import { X } from 'lucide-react';

interface SportsManagementProps {
  supportedSports: string[];
  setSupportedSports: React.Dispatch<React.SetStateAction<string[]>>;
}

export const SportsManagement: React.FC<SportsManagementProps> = ({ supportedSports, setSupportedSports }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Supported Sports Management</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {supportedSports.map(sport => (
          <div key={sport} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
            {sport}
            <button onClick={() => setSupportedSports(prev => prev.filter(s => s !== sport))} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="New Sport Name"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#d11a2a]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = e.currentTarget.value.trim();
              if (val && !supportedSports.includes(val)) {
                setSupportedSports(prev => [...prev, val]);
                e.currentTarget.value = '';
              }
            }
          }}
        />
      </div>
    </div>
  );
};
