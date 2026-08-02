import React, { useState, useEffect } from 'react';
import { SPORT_CONFIGS } from '../services/ScoreboardService';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { dbService } from '../lib/database';

export default function RulesHandbook() {
  const [selectedSport, setSelectedSport] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSport = localStorage.getItem('match_sport_type');
      if (savedSport && SPORT_CONFIGS[savedSport.toLowerCase()]) {
        return savedSport.toLowerCase();
      }
    }
    return 'cricket';
  });

  const config = SPORT_CONFIGS[selectedSport];

  useEffect(() => {
    const matchId = typeof window !== 'undefined' ? localStorage.getItem('active_match_id') : null;
    if (matchId) {
      dbService.get('matches', matchId).then((match: any) => {
        if (match && match.sport_type && SPORT_CONFIGS[match.sport_type.toLowerCase()]) {
          setSelectedSport(match.sport_type.toLowerCase());
        }
      }).catch(() => {});
    }
  }, []);

  const getRules = (sport: string) => {
    const sportConfig = SPORT_CONFIGS[sport];
    if (sportConfig && sportConfig.rules) {
      return sportConfig.rules.map((rule, idx) => {
        // Parse simple titles if possible
        const parts = rule.split(':');
        if (parts.length > 1) {
          return { title: parts[0], desc: parts.slice(1).join(':').trim() };
        }
        return { title: `Regulation ${idx + 1}`, desc: rule };
      });
    }

    return [
      { title: 'General Scoring', desc: `This sport uses ${config?.type || 'standard'} tracking. Primary metric: ${config?.scoreLabel || 'Points'}.` }
    ];
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Rules Handbook</h2>
            <p className="text-sm text-slate-500">Select a sport to view scoring regulations</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Sport</label>
          <select 
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
          >
            {Object.keys(SPORT_CONFIGS).map(sport => (
              <option key={sport} value={sport}>{sport.charAt(0).toUpperCase() + sport.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {getRules(selectedSport).map((rule, idx) => (
            <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-start space-x-4">
              <div className="mt-1">
                <CheckCircle className="text-blue-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{rule.title}</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="text-amber-500 shrink-0 w-5 h-5 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-bold">Configuration Context: </span>
            This sport uses the <strong>{config?.type}</strong> template. 
            The primary scoring label is <strong>{config?.scoreLabel}</strong>
            {config?.periodLabel ? ` divided into ${config.periodLabel}s` : ''}
            {config?.setsLabel ? ` organized by ${config.setsLabel}` : ''}.
          </div>
        </div>
      </div>
    </div>
  );
}
