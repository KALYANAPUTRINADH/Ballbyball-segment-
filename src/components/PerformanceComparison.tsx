import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function PerformanceComparison({ sport }: { sport: string }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await dbService.get('player_stats', user.uid);
        if (data) {
          setStats(data);
        }
      } catch (e) {
        console.warn("Error fetching player stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  if (!user) return null;

  // Define data based on sport
  let chartData = [];
  const currentSport = sport === 'All' ? 'Cricket' : sport; // Default to Cricket for All

  if (currentSport === 'Cricket') {
    chartData = [
      { subject: 'Batting Avg', A: stats?.average || 0, B: 35, fullMark: 100 },
      { subject: 'Strike Rate', A: stats?.strike_rate || 0, B: 120, fullMark: 250 },
      { subject: 'Economy', A: stats?.economy || 0, B: 8, fullMark: 12 },
      { subject: 'Wickets', A: stats?.wickets || 0, B: 50, fullMark: 100 },
      { subject: 'Runs', A: stats?.runs || 0, B: 1000, fullMark: 2000 },
    ];
  } else if (currentSport === 'Basketball') {
    chartData = [
      { subject: 'Points/G', A: stats?.points_per_game || 0, B: 15, fullMark: 40 },
      { subject: 'Rebounds/G', A: stats?.rebounds_per_game || 0, B: 5, fullMark: 15 },
      { subject: 'Assists/G', A: stats?.assists_per_game || 0, B: 5, fullMark: 15 },
      { subject: 'FG %', A: stats?.field_goal_pct || 0, B: 45, fullMark: 100 },
      { subject: '3PT %', A: stats?.three_point_pct || 0, B: 35, fullMark: 100 },
    ];
  } else if (currentSport === 'Football') {
    chartData = [
      { subject: 'Goals/G', A: stats?.goals_per_game || 0, B: 0.5, fullMark: 2 },
      { subject: 'Assists/G', A: stats?.assists_per_game || 0, B: 0.3, fullMark: 1 },
      { subject: 'Pass Acc %', A: stats?.pass_accuracy || 0, B: 80, fullMark: 100 },
      { subject: 'Tackles/G', A: stats?.tackles_per_game || 0, B: 2, fullMark: 10 },
      { subject: 'Interceptions', A: stats?.interceptions_per_game || 0, B: 1.5, fullMark: 5 },
    ];
  } else if (currentSport === 'Volleyball') {
    chartData = [
      { subject: 'Kills/S', A: stats?.kills_per_set || 0, B: 3, fullMark: 10 },
      { subject: 'Blocks/S', A: stats?.blocks_per_set || 0, B: 1, fullMark: 5 },
      { subject: 'Digs/S', A: stats?.digs_per_set || 0, B: 2, fullMark: 10 },
      { subject: 'Aces/S', A: stats?.aces_per_set || 0, B: 0.5, fullMark: 3 },
      { subject: 'Hit %', A: stats?.hitting_pct || 0, B: 25, fullMark: 100 },
    ];
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
      <h2 className="text-base font-bold text-gray-900 mb-1">Performance Comparison</h2>
      <p className="text-xs text-gray-500 mb-4">Your {currentSport} stats vs Average Player</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
            <Radar name="You" dataKey="A" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.5} />
            <Radar name="Avg Player" dataKey="B" stroke="#64748b" fill="#94a3b8" fillOpacity={0.3} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
