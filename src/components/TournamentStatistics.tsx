import React, { useState, useEffect } from 'react';
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Trophy, Award, User, Users, Plus, Edit3, Trash2, Check, 
  HelpCircle, Sparkles, Star, TrendingUp, Shield, Zap, Settings, RefreshCw 
} from 'lucide-react';

interface TournamentStatisticsProps {
  tournamentId: any;
  sportType: string;
  tournament?: any;
}

export function TournamentStatistics({ tournamentId, sportType = 'Cricket', tournament }: TournamentStatisticsProps) {
  const { user, isAdmin } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [statsList, setStatsList] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'leaderboards' | 'table' | 'manage'>('leaderboards');
  
  // Form State for Adding / Editing Player Stats
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPlayerName, setFormPlayerName] = useState('');
  const [formTeamName, setFormTeamName] = useState('');
  const [formRuns, setFormRuns] = useState(0);
  const [formWickets, setFormWickets] = useState(0);
  const [formGoals, setFormGoals] = useState(0);
  const [formAssists, setFormAssists] = useState(0);
  const [formPoints, setFormPoints] = useState(0);
  const [formCatches, setFormCatches] = useState(0);
  const [formMvpPoints, setFormMvpPoints] = useState(0);
  const [formIsEmerging, setFormIsEmerging] = useState(false);
  const [formCustomAward, setFormCustomAward] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parse suggested teams
  const suggestedTeams = React.useMemo(() => {
    if (tournament?.teamNames) {
      return tournament.teamNames.split(',').map((t: string) => t.trim());
    }
    return [];
  }, [tournament]);

  // Sync player statistics in real-time
  useEffect(() => {
    if (!tournamentId) return;

    setLoading(true);
    const unsubscribe = dbService.subscribe(
      'player_stats', 
      { tournamentId }, 
      (data) => {
        setStatsList(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tournamentId]);

  // Submit / Save Stat Form
  const handleSaveStat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlayerName || !formTeamName) return;

    try {
      setSaving(true);
      const payload = {
        tournamentId,
        sportType,
        playerName: formPlayerName,
        teamName: formTeamName,
        runs: Number(formRuns),
        wickets: Number(formWickets),
        goals: Number(formGoals),
        assists: Number(formAssists),
        points: Number(formPoints),
        catches: Number(formCatches),
        mvpPoints: Number(formMvpPoints),
        isEmerging: formIsEmerging,
        customAward: formCustomAward
      };

      if (editingId) {
        await dbService.update('player_stats', editingId, payload);
      } else {
        await dbService.create('player_stats', payload);
      }

      // Reset form
      handleResetForm();
    } catch (err) {
      console.error('Failed to save player stat', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormPlayerName('');
    setFormTeamName(suggestedTeams[0] || '');
    setFormRuns(0);
    setFormWickets(0);
    setFormGoals(0);
    setFormAssists(0);
    setFormPoints(0);
    setFormCatches(0);
    setFormMvpPoints(0);
    setFormIsEmerging(false);
    setFormCustomAward('');
    setShowForm(false);
  };

  const handleEdit = (player: any) => {
    setEditingId(player.id);
    setFormPlayerName(player.playerName || '');
    setFormTeamName(player.teamName || '');
    setFormRuns(player.runs || 0);
    setFormWickets(player.wickets || 0);
    setFormGoals(player.goals || 0);
    setFormAssists(player.assists || 0);
    setFormPoints(player.points || 0);
    setFormCatches(player.catches || 0);
    setFormMvpPoints(player.mvpPoints || 0);
    setFormIsEmerging(player.isEmerging || false);
    setFormCustomAward(player.customAward || '');
    setShowForm(true);
    setActiveSubTab('manage');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this player statistic?')) {
      try {
        await dbService.remove('player_stats', id);
      } catch (e) {
        console.error('Failed to delete stat', e);
      }
    }
  };

  // Dynamic Leaders Computations
  const mostRuns = [...statsList].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0];
  const mostWickets = [...statsList].sort((a, b) => (b.wickets || 0) - (a.wickets || 0))[0];
  const mostGoals = [...statsList].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];
  const mostAssists = [...statsList].sort((a, b) => (b.assists || 0) - (a.assists || 0))[0];
  const bestFielder = [...statsList].sort((a, b) => (b.catches || 0) - (a.catches || 0))[0];
  const tournamentMvp = [...statsList].sort((a, b) => (b.mvpPoints || 0) - (a.mvpPoints || 0))[0];
  const emergingPlayer = statsList.filter(p => p.isEmerging).sort((a, b) => (b.mvpPoints || 0) - (a.mvpPoints || 0))[0];
  const customAwardWinners = statsList.filter(p => p.customAward && p.customAward.trim() !== '');

  // Chart Mappings
  const chartData = statsList.slice(0, 8).map(p => ({
    name: p.playerName,
    runs: p.runs || 0,
    wickets: p.wickets || 0,
    goals: p.goals || 0,
    assists: p.assists || 0,
    points: p.points || 0,
    mvp: p.mvpPoints || 0
  }));

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 bg-white rounded-xl border border-slate-200">
        <RefreshCw className="w-8 h-8 text-[#d11a2a] animate-spin mb-3" />
        <span className="text-slate-600 font-semibold text-sm">Syncing Live Tournament Stats...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Sub Navigation */}
      <div className="flex border-b border-slate-200 gap-1 bg-white p-1 rounded-lg border">
        <button
          onClick={() => setActiveSubTab('leaderboards')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
            activeSubTab === 'leaderboards'
              ? 'bg-[#d11a2a] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Awards & Leaderboards</span>
        </button>
        <button
          onClick={() => setActiveSubTab('table')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
            activeSubTab === 'table'
              ? 'bg-[#d11a2a] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Full Stats Table</span>
        </button>
        <button
          onClick={() => setActiveSubTab('manage')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
            activeSubTab === 'manage'
              ? 'bg-[#d11a2a] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Manage Stats {isAdmin && <span className="ml-1 bg-red-800 text-[9px] px-1.5 py-0.2 rounded-full uppercase text-white">Admin</span>}</span>
        </button>
      </div>

      {/* Empty State Banner */}
      {statsList.length === 0 && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 border-dashed text-center flex flex-col items-center">
          <Award className="w-16 h-16 text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Tournament Stats Recorded Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mt-1 mb-5">
            Connect live match sheets, log custom plays, or populate the leaderboard dashboard to view performance awards.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowForm(true);
                setActiveSubTab('manage');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
            >
              Add Player Statistics
            </button>
          </div>
        </div>
      )}

      {statsList.length > 0 && activeSubTab === 'leaderboards' && (
        <div className="space-y-6">
          
          {/* Main Visual Leaders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* MVP award */}
            {tournamentMvp && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-xl shadow-sm relative group flex flex-col justify-between overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-amber-500/10 rounded-full"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-amber-700 font-mono uppercase bg-amber-100 px-2 py-0.5 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1 fill-amber-700" /> Tournament MVP
                    </span>
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#d11a2a] transition-colors">
                    {tournamentMvp.playerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold">{tournamentMvp.teamName}</p>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 border-t border-amber-100 pt-3">
                  <span className="text-2xl font-black text-amber-600 font-mono">{tournamentMvp.mvpPoints}</span>
                  <span className="text-[10px] text-amber-700 font-mono uppercase">MVP Index Points</span>
                </div>
              </div>
            )}

            {/* Orange Cap / Golden Boot (Primary Scoring) */}
            {(sportType === 'Cricket' && mostRuns) ? (
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group flex flex-col justify-between overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-[#d11a2a]/5 rounded-full"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-[#d11a2a] font-mono uppercase bg-red-50 px-2 py-0.5 rounded-full flex items-center">
                      <Zap className="w-3 h-3 mr-1" /> Orange Cap / Most Runs
                    </span>
                    <Award className="w-5 h-5 text-orange-500" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#d11a2a] transition-colors">
                    {mostRuns.playerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold">{mostRuns.teamName}</p>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 border-t border-slate-100 pt-3">
                  <span className="text-2xl font-black text-[#d11a2a] font-mono">{mostRuns.runs}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Runs Scored</span>
                </div>
              </div>
            ) : (mostGoals && (
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group flex flex-col justify-between overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-[#d11a2a]/5 rounded-full"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-red-600 font-mono uppercase bg-red-50 px-2 py-0.5 rounded-full flex items-center">
                      <Zap className="w-3 h-3 mr-1" /> Golden Boot / Most Goals
                    </span>
                    <Award className="w-5 h-5 text-red-500" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#d11a2a] transition-colors">
                    {mostGoals.playerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold">{mostGoals.teamName}</p>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 border-t border-slate-100 pt-3">
                  <span className="text-2xl font-black text-red-600 font-mono">{mostGoals.goals}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Goals</span>
                </div>
              </div>
            ))}

            {/* Purple Cap / Leading Assist or Wicket Keeper */}
            {(sportType === 'Cricket' && mostWickets) ? (
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group flex flex-col justify-between overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-purple-500/5 rounded-full"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-purple-700 font-mono uppercase bg-purple-50 px-2 py-0.5 rounded-full flex items-center">
                      <Shield className="w-3 h-3 mr-1" /> Purple Cap / Most Wickets
                    </span>
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#d11a2a] transition-colors">
                    {mostWickets.playerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold">{mostWickets.teamName}</p>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 border-t border-slate-100 pt-3">
                  <span className="text-2xl font-black text-purple-600 font-mono">{mostWickets.wickets}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Wickets taken</span>
                </div>
              </div>
            ) : (mostAssists && (
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group flex flex-col justify-between overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-purple-500/5 rounded-full"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-purple-700 font-mono uppercase bg-purple-50 px-2 py-0.5 rounded-full flex items-center">
                      <Shield className="w-3 h-3 mr-1" /> Leading Assists
                    </span>
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#d11a2a] transition-colors">
                    {mostAssists.playerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold">{mostAssists.teamName}</p>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 border-t border-slate-100 pt-3">
                  <span className="text-2xl font-black text-purple-600 font-mono">{mostAssists.assists}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Assists</span>
                </div>
              </div>
            ))}

            {/* Best Fielder / Best Defensive Player */}
            {bestFielder && (
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group flex flex-col justify-between overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-emerald-500/5 rounded-full"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-emerald-700 font-mono uppercase bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> {sportType === 'Cricket' ? 'Best Fielder' : 'Defensive Pillar / Saves'}
                    </span>
                    <Star className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#d11a2a] transition-colors">
                    {bestFielder.playerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold">{bestFielder.teamName}</p>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 border-t border-slate-100 pt-3">
                  <span className="text-2xl font-black text-emerald-600 font-mono">{bestFielder.catches}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{sportType === 'Cricket' ? 'Catches / Outvolve' : 'Saves / Tackles'}</span>
                </div>
              </div>
            )}

          </div>

          {/* Emerging and Highlight Awards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Emerging Player Spotlight */}
            {emergingPlayer ? (
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-y-12 translate-x-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div>
                  <span className="text-[9px] font-mono tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    Emerging Player of Tournament
                  </span>
                  <h4 className="text-xl font-black text-white mt-3">{emergingPlayer.playerName}</h4>
                  <p className="text-xs text-indigo-200 mt-1">{emergingPlayer.teamName}</p>
                  <p className="text-[11px] text-slate-400 mt-3 italic max-w-sm">
                    A breakthrough youngster who has shown elite consistency, scoring {emergingPlayer.runs || emergingPlayer.goals || 0} runs/goals & demonstrating absolute tactical discipline.
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/30 rounded-full flex items-center justify-center text-indigo-400 text-xl font-bold font-mono mx-auto mb-1">
                    🌟
                  </div>
                  <span className="text-xs font-mono block text-slate-300">Impact Score</span>
                  <span className="text-lg font-black text-indigo-400 font-mono">{emergingPlayer.mvpPoints}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl border-dashed flex items-center justify-center text-slate-500 text-xs">
                Mark any young player as 'Emerging' in database to highlight them here.
              </div>
            )}

            {/* Custom Highlight Awards List */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" /> Special Highlight Awards
              </h3>
              {customAwardWinners.length > 0 ? (
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {customAwardWinners.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.customAward}</p>
                        <p className="text-[10px] text-slate-500">{p.playerName} &bull; <span className="font-mono">{p.teamName}</span></p>
                      </div>
                      <span className="text-lg">🏅</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-6 text-center">
                  No special custom highlight awards created yet. Use 'Manage Stats' to assign unique awards to players!
                </p>
              )}
            </div>

          </div>

          {/* Visualizing Performers Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Top Run/Goal Scorers Visualization</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  {sportType === 'Cricket' ? (
                    <Bar dataKey="runs" fill="#d11a2a" name="Runs Scored" radius={[4, 4, 0, 0]} />
                  ) : (
                    <Bar dataKey="goals" fill="#d11a2a" name="Goals Scored" radius={[4, 4, 0, 0]} />
                  )}
                  <Bar dataKey="mvp" fill="#0ea5e9" name="MVP Points" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {statsList.length > 0 && activeSubTab === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">All Registered Player Statistics</h3>
            <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              {statsList.length} Players
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <th className="p-3">Player Name</th>
                  <th className="p-3">Team</th>
                  {sportType === 'Cricket' ? (
                    <>
                      <th className="p-3 text-right">Runs</th>
                      <th className="p-3 text-right">Wickets</th>
                      <th className="p-3 text-right">Catches</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-right">Goals</th>
                      <th className="p-3 text-right">Assists</th>
                      <th className="p-3 text-right">Saves/Tackles</th>
                    </>
                  )}
                  <th className="p-3 text-right">MVP Points</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Custom Award</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsList.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50/60 transition font-medium">
                    <td className="p-3 text-slate-900 font-bold">{player.playerName}</td>
                    <td className="p-3 text-slate-600">{player.teamName}</td>
                    {sportType === 'Cricket' ? (
                      <>
                        <td className="p-3 text-right font-mono text-[#d11a2a] font-bold">{player.runs || 0}</td>
                        <td className="p-3 text-right font-mono text-purple-600 font-bold">{player.wickets || 0}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">{player.catches || 0}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-right font-mono text-red-600 font-bold">{player.goals || 0}</td>
                        <td className="p-3 text-right font-mono text-purple-600 font-bold">{player.assists || 0}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">{player.catches || 0}</td>
                      </>
                    )}
                    <td className="p-3 text-right font-mono text-amber-600 font-extrabold">{player.mvpPoints || 0}</td>
                    <td className="p-3 text-center">
                      {player.isEmerging ? (
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-bold">Emerging</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Standard</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 italic max-w-[200px] truncate">{player.customAward || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'manage' && (
        <div className="space-y-6">
          
          {/* Main Action Bar */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Manage Tournament Leaders</h3>
            <button
              onClick={() => {
                if (showForm) handleResetForm();
                else setShowForm(true);
              }}
              className="bg-[#d11a2a] text-white hover:bg-red-700 font-bold text-xs px-3 py-2 rounded-lg flex items-center space-x-1.5 transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? 'Hide Form' : 'Add Player Record'}</span>
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <form onSubmit={handleSaveStat} className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800 text-sm">
                  {editingId ? 'Edit Player Statistics' : 'Register New Player Stats'}
                </h4>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Player Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Player Name *</label>
                  <input
                    type="text"
                    required
                    value={formPlayerName}
                    onChange={(e) => setFormPlayerName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none"
                    placeholder="e.g. Rohith Sharma"
                  />
                </div>

                {/* Team Name Selector / Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Name *</label>
                  {suggestedTeams.length > 0 ? (
                    <select
                      value={formTeamName}
                      onChange={(e) => setFormTeamName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="">Select Team</option>
                      {suggestedTeams.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formTeamName}
                      onChange={(e) => setFormTeamName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none"
                      placeholder="e.g. Royal Warriors"
                    />
                  )}
                </div>

                {/* Special custom highlight award */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Special Highlight Award</label>
                  <input
                    type="text"
                    value={formCustomAward}
                    onChange={(e) => setFormCustomAward(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none"
                    placeholder="e.g. Catch of the Tournament, Best Bowler"
                  />
                </div>

                {/* Dynamic sport specific metric inputs */}
                {sportType === 'Cricket' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Runs Scored</label>
                      <input
                        type="number"
                        min="0"
                        value={formRuns}
                        onChange={(e) => setFormRuns(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Wickets Taken</label>
                      <input
                        type="number"
                        min="0"
                        value={formWickets}
                        onChange={(e) => setFormWickets(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Catches / Fielding Points</label>
                      <input
                        type="number"
                        min="0"
                        value={formCatches}
                        onChange={(e) => setFormCatches(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Goals Scored</label>
                      <input
                        type="number"
                        min="0"
                        value={formGoals}
                        onChange={(e) => setFormGoals(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assists Provided</label>
                      <input
                        type="number"
                        min="0"
                        value={formAssists}
                        onChange={(e) => setFormAssists(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Defensive Saves / Tackles</label>
                      <input
                        type="number"
                        min="0"
                        value={formCatches}
                        onChange={(e) => setFormCatches(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                {/* MVP Points */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MVP Impact Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formMvpPoints}
                    onChange={(e) => setFormMvpPoints(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#d11a2a] focus:outline-none font-mono"
                  />
                </div>

                {/* Emerging Player Toggle */}
                <div className="flex items-center space-x-2 mt-5">
                  <input
                    type="checkbox"
                    id="isEmerging"
                    checked={formIsEmerging}
                    onChange={(e) => setFormIsEmerging(e.target.checked)}
                    className="w-4 h-4 rounded text-[#d11a2a] border-slate-300 focus:ring-[#d11a2a]"
                  />
                  <label htmlFor="isEmerging" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Young / Emerging Player?
                  </label>
                </div>

              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#d11a2a] hover:bg-red-700 disabled:bg-slate-400 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Stat' : 'Save Stat'}
                </button>
              </div>
            </form>
          )}

          {/* Management List with Delete/Edit */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 text-xs">Registered Tournament Players</h4>
            </div>
            
            {statsList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {statsList.map((player) => (
                  <div key={player.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/40 transition">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-slate-900 text-sm leading-none">{player.playerName}</p>
                          {player.isEmerging && (
                            <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                              Emerging
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          Team: {player.teamName} &bull; Sport: {player.sportType || 'Cricket'}
                        </p>
                        {player.customAward && (
                          <p className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block">
                            Award: {player.customAward}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">MVP IND</span>
                        <span className="font-mono text-sm font-black text-amber-500">{player.mvpPoints || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(player)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition"
                          title="Edit stats"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(player.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-[#d11a2a] transition"
                          title="Delete stats"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No statistics stored in the database. Add player stats to view them here.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
