import React, { useEffect, useState } from 'react';
import { Award, Trophy, Star, TrendingUp, Medal } from 'lucide-react';
import { dbService } from '../lib/database';

export function MatchMVPDisplay() {
  const [recentMVP, setRecentMVP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentMatch();
  }, []);

  const fetchRecentMatch = async () => {
    try {
      setLoading(true);
      // Fetch completed matches
      const matches: any[] = await dbService.getAll('matches') || [];
      
      const completedMatches = matches
        .filter(m => m.status === 'Completed' && m.playerStats)
        .sort((a, b) => {
           // try to sort by timestamp if available, otherwise assume latest is at the end
           return (b.id || 0) - (a.id || 0);
        });

      if (completedMatches.length > 0) {
        const latestMatch = completedMatches[0];
        const mvp = calculateMVP(latestMatch);
        if (mvp) {
          setRecentMVP({
            matchName: latestMatch.name,
            sportType: latestMatch.sport_type || 'Cricket',
            ...mvp
          });
        }
      }
    } catch (error) {
      console.warn('Error fetching MVP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMVP = (match: any) => {
    if (!match.playerStats) return null;
    const sportType = match.sport_type || 'Cricket';
    let bestPlayer = null;
    let maxPoints = -1;

    Object.entries(match.playerStats).forEach(([playerName, sportStats]: [string, any]) => {
      const stats = sportStats?.[sportType];
      if (!stats) return;

      let points = 0;
      let highlights = [];

      if (sportType === 'Cricket') {
        points += (stats.runs || 0) * 1;
        points += (stats.wickets || 0) * 20;
        
        if (stats.runs > 0) highlights.push(`${stats.runs} Runs`);
        if (stats.wickets > 0) highlights.push(`${stats.wickets} Wickets`);
      } else {
        // Generic fallback for other sports
        points += (stats.goals || 0) * 10;
        points += (stats.points || 0) * 1;
        points += (stats.assists || 0) * 5;
        
        if (stats.goals > 0) highlights.push(`${stats.goals} Goals`);
        if (stats.points > 0) highlights.push(`${stats.points} Points`);
        if (stats.assists > 0) highlights.push(`${stats.assists} Assists`);
      }

      // If manual MOTM was selected, give them a boost to ensure they win if points are close
      if (match.awards?.motm === playerName) {
         points += 50; 
      }

      if (points > maxPoints && points > 0) {
        maxPoints = points;
        bestPlayer = {
          name: playerName,
          points,
          highlights: highlights.join(' & ') || 'Solid Performance',
          stats
        };
      }
    });

    return bestPlayer;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!recentMVP) return null;

  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md border border-amber-400 p-1 mb-4 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
      
      <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-amber-600">
            <Trophy className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Automated Match MVP</h3>
          </div>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {recentMVP.matchName}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-black shadow-inner">
              {recentMVP.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow">
              <Medal className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="text-lg font-black text-slate-900 leading-tight">{recentMVP.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {recentMVP.highlights}
              </span>
              <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3 mr-1" />
                {recentMVP.points} Impact Pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
