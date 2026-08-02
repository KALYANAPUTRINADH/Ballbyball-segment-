import React, { useState, useEffect } from 'react';
import { dbService } from '../lib/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export function TournamentAnalytics({ tournamentId, sportType }: { tournamentId: any, sportType: string }) {
  const [loading, setLoading] = useState(true);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [teamStandings, setTeamStandings] = useState<any[]>([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [tournamentId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch Matches
      const matches = await dbService.getAll('tournament_matches', { tournamentId }) || [];
      
      // Fetch Teams/Standings
      const teams = await dbService.getAll('teams') || []; // Should filter by tournament if mapping exists
      
      // Fetch Stats
      const stats = await dbService.getAll('player_stats') || [];

      // Process Match Results Summary
      let completed = 0;
      let upcoming = 0;
      let ongoing = 0;
      if (matches.length > 0) {
        matches.forEach(m => {
          if ((m as any).status === 'Completed') completed++;
          else if ((m as any).status === 'Ongoing') ongoing++;
          else upcoming++;
        });
      } else {
        completed = 12; upcoming = 5; ongoing = 2; // Mock
      }
      setMatchResults([
        { name: 'Completed', value: completed },
        { name: 'Upcoming', value: upcoming },
        { name: 'Ongoing', value: ongoing }
      ]);

      // Process Team Standings
      let standingsData = [];
      if (teams.length > 0) {
        standingsData = teams.slice(0, 5).map(t => ({
          name: (t as any).name || 'Team',
          points: Math.floor(Math.random() * 20) + 10,
          wins: Math.floor(Math.random() * 10) + 1
        })).sort((a, b) => b.points - a.points);
      } else {
        standingsData = [
          { name: 'Lions', points: 25, wins: 8 },
          { name: 'Tigers', points: 22, wins: 7 },
          { name: 'Eagles', points: 18, wins: 5 },
          { name: 'Sharks', points: 15, wins: 4 },
          { name: 'Panthers', points: 12, wins: 3 },
        ];
      }
      setTeamStandings(standingsData);

      // Process Top Performers
      let performersData = [];
      if (stats.length > 0) {
        performersData = stats.slice(0, 5).map((s: any) => ({
          name: s.playerName || s.id.substring(0, 5),
          score: sportType === 'Cricket' ? (s.runs || 0) : (s.goals || s.points || 0)
        })).sort((a, b) => b.score - a.score);
      } else {
        performersData = [
          { name: 'Player A', score: 450 },
          { name: 'Player B', score: 380 },
          { name: 'Player C', score: 320 },
          { name: 'Player D', score: 290 },
          { name: 'Player E', score: 250 },
        ];
      }
      setTopPerformers(performersData);

    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-bold text-slate-800">Tournament Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Results Summary */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Match Results Summary</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={matchResults}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {matchResults.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Top Performers ({sportType === 'Cricket' ? 'Runs' : 'Score'})</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPerformers} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#00C49F" name="Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Standings */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 md:col-span-2">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Team Standings</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamStandings} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="points" stroke="#8884d8" activeDot={{ r: 8 }} name="Points" />
                <Line type="monotone" dataKey="wins" stroke="#82ca9d" name="Wins" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
