import { SportIcon } from '../components/SportIcon';
import React, { useState } from 'react';
import { Award, Star, Trophy, Users, Heart, Flame } from 'lucide-react';

const SPORTS = ["Cricket","Football","Basketball","Tennis","Pickleball","Hockey","Volleyball","Badminton","Table Tennis"];

const AWARDS_DATA: Record<string, any[]> = {};

import { Shield } from 'lucide-react';

export default function StreamlifyAwards() {
  const [selectedSport, setSelectedSport] = useState('Cricket');
  
  const awards = AWARDS_DATA[selectedSport] || [
    { title: "Player of the Month", name: "TBD", team: "TBD", icon: <Star className="w-8 h-8 text-slate-300" /> },
    { title: "Rising Star", name: "TBD", team: "TBD", icon: <Flame className="w-8 h-8 text-slate-300" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        {SPORTS.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-4 py-2 whitespace-nowrap rounded-full font-bold text-sm transition-colors ${selectedSport === sport ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {sport}
          </button>
        ))}
      </div>

      <div className="text-center py-12 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-slate-900 to-slate-900"></div>
        <Award className="w-16 h-16 mx-auto mb-4 text-amber-400 relative z-10" />
        <h1 className="text-4xl font-bold mb-3 relative z-10">Streamlify Awards 2026</h1>
        <p className="text-slate-300 relative z-10 text-lg">Celebrating the finest {selectedSport} talent on our platform</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {awards.map((award, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
              {award.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{award.title}</p>
              <h3 className="text-xl font-bold text-slate-900">{award.name}</h3>
              <p className="text-slate-600 font-medium">{award.team}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
