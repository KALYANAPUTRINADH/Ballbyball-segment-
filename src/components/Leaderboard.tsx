import { SportIcon } from '../components/SportIcon';
import { dbService } from '../lib/database';
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Flame } from 'lucide-react';

const SPORTS = ["Cricket","Football","Basketball","Tennis","Pickleball","Hockey","Volleyball","Badminton","Table Tennis"];

export function Leaderboard() {
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [activeTab, setActiveTab] = useState('runs'); // generic tabs depend on sport
  
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const allMatches = await dbService.getAll('matches') || [];
        // Generic sorting/logic for now
        const sorted = (allMatches as any[]).sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0)).slice(0, 10);
        
        const topTeams = sorted.map((data: any, idx) => ({
          rank: idx + 1,
          name: data.teamA || data.team_a || "Unknown Team",
          team: data.teamA || data.team_a,
          runs: parseInt(data.runs) || 0,
          goals: data.goals || 0,
          points: data.points || 0,
          average: 0,
          strikeRate: 0,
          wickets: parseInt(data.wickets) || 0,
          economy: 0
        }));
        
        setLeaderboardData(topTeams);
      } catch (e) {
        console.warn("Offline or error fetching leaderboard");
        setLeaderboardData([]);
      }
    };
    fetchLeaderboard();
  }, [selectedSport]);

  const getTabsForSport = () => {
    switch (selectedSport) {
      case 'Cricket': return [{ id: 'runs', label: 'Top Batsmen' }, { id: 'wickets', label: 'Top Bowlers' }];
      case 'Football': return [{ id: 'goals', label: 'Top Scorers' }, { id: 'assists', label: 'Top Assists' }];
      case 'Basketball': return [{ id: 'points', label: 'Most Points' }, { id: 'rebounds', label: 'Top Rebounds' }];
      default: return [{ id: 'points', label: 'Top Ranked' }];
    }
  };

  const tabs = getTabsForSport();
  
  // ensure activeTab is valid for sport
  useEffect(() => {
    if (!tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [selectedSport, tabs, activeTab]);

  const sortedData = [...leaderboardData].sort((a,b) => {
    return (b[activeTab] || 0) - (a[activeTab] || 0);
  }).map((t, idx) => ({ ...t, rank: idx + 1 }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-sans tracking-tight">Leaderboards</h1>
          <p className="text-slate-600 mt-1">Top performers of the season across all categories</p>
        </div>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar mb-2">
        {SPORTS.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`flex items-center px-4 py-2 whitespace-nowrap rounded-full font-bold text-sm transition-colors ${selectedSport === sport ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {sport}
          </button>
        ))}
      </div>

      <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-lg w-max mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Player</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">
                {activeTab === 'runs' ? 'Runs' : activeTab === 'wickets' ? 'Wickets' : activeTab === 'goals' ? 'Goals' : 'Score'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((player) => (
              <tr key={player.rank} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {player.rank === 1 ? <Trophy className="w-5 h-5 text-yellow-500 mr-2" /> : 
                     player.rank === 2 ? <Medal className="w-5 h-5 text-slate-400 mr-2" /> : 
                     player.rank === 3 ? <Medal className="w-5 h-5 text-amber-600 mr-2" /> : 
                     <span className="w-5 mr-2 text-center font-bold text-slate-400">{player.rank}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">{player.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{player.team}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600 text-right text-lg">
                  {player[activeTab] || 0}
                </td>
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No records found for this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
