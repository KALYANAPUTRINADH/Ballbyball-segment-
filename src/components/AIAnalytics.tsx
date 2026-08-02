import React, { useState, useEffect } from 'react';
import { Brain, Video, Crosshair, BarChart3, FastForward, Activity, Save, Loader2 } from 'lucide-react';
import { PerformanceMetrics } from './PerformanceMetrics';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';

export function AIAnalytics() {
  const { user } = useAuth();
  const [teamA, setTeamA] = useState('Mumbai');
  const [teamB, setTeamB] = useState('Chennai');
  const [matchStats, setMatchStats] = useState<any>(null);
  const [activeSport, setActiveSport] = useState(localStorage.getItem('activeSport') || 'Cricket');

  // User performance stats state
  const [playerStats, setPlayerStats] = useState<any>({
    matches: 0,
    // Cricket
    innings: 0,
    runs: 0,
    highest_score: 0,
    average: 0.0,
    strike_rate: 0.0,
    hundreds: 0,
    fifties: 0,
    wickets: 0,
    economy: 0.0,
    best_bowling: '0/0',
    // Basketball
    points_per_game: 0.0,
    rebounds_per_game: 0.0,
    assists_per_game: 0.0,
    field_goal_pct: 0.0,
    three_point_pct: 0.0,
    // Football
    goals_per_game: 0.0,
    assists_per_game_fb: 0.0,
    pass_accuracy: 0.0,
    tackles_per_game: 0.0,
    interceptions_per_game: 0.0,
    // Volleyball
    kills_per_set: 0.0,
    blocks_per_set: 0.0,
    digs_per_set: 0.0,
    aces_per_set: 0.0,
    hitting_pct: 0.0,
  });

  const [loadingStats, setLoadingStats] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const a = localStorage.getItem('match_team_a');
      const b = localStorage.getItem('match_team_b');
      const sport = localStorage.getItem('activeSport');
      if (a) setTeamA(a);
      if (b) setTeamB(b);
      if (sport && sport !== 'All') setActiveSport(sport);
      else setActiveSport('Cricket');

      const fetchMatchData = async () => {
        try {
          const matchId = localStorage.getItem('active_match_id');
          if (matchId) {
            const data = await dbService.get('matches', matchId);
            if (data && (data as any).runs) {
              setMatchStats(data);
            }
          }
        } catch (e) {
            console.warn("Offline or error fetching match stats");
        }
      };
      
      const fetchPlayerStats = async () => {
        if (!user) return;
        setLoadingStats(true);
        try {
          const data = await dbService.get('player_stats', user.uid);
          if (data) {
            setPlayerStats(prev => ({ ...prev, ...data }));
          }
        } catch (e) {
          console.warn("Error fetching player stats", e);
        } finally {
          setLoadingStats(false);
        }
      };

      fetchMatchData();
      fetchPlayerStats();
    }
  }, [user]);

  const handleStatChange = (key: string, value: number | string) => {
    setPlayerStats({ ...playerStats, [key]: value });
  };

  const handleSaveStats = async () => {
    if (!user) return;
    setSavingStats(true);
    setMessage('');
    try {
      const statsToSave = { ...playerStats, id: user.uid, updated_at: new Date().toISOString() };
      const data = await dbService.upsert('player_stats', statsToSave);
      
      if (!data) throw new Error('Failed to save stats');
      
      setMessage('Performance statistics saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`Error saving statistics: ${error.message}`);
    } finally {
      setSavingStats(false);
    }
  };

  const renderCricketStats = () => (
    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Innings</label>
        <input type="number" value={playerStats.innings || 0} onChange={(e) => handleStatChange('innings', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Runs</label>
        <input type="number" value={playerStats.runs || 0} onChange={(e) => handleStatChange('runs', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Highest Score</label>
        <input type="number" value={playerStats.highest_score || 0} onChange={(e) => handleStatChange('highest_score', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Average</label>
        <input type="number" step="0.01" value={playerStats.average || 0} onChange={(e) => handleStatChange('average', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Strike Rate</label>
        <input type="number" step="0.01" value={playerStats.strike_rate || 0} onChange={(e) => handleStatChange('strike_rate', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Hundreds (100s)</label>
        <input type="number" value={playerStats.hundreds || 0} onChange={(e) => handleStatChange('hundreds', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Fifties (50s)</label>
        <input type="number" value={playerStats.fifties || 0} onChange={(e) => handleStatChange('fifties', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Wickets</label>
        <input type="number" value={playerStats.wickets || 0} onChange={(e) => handleStatChange('wickets', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Economy</label>
        <input type="number" step="0.01" value={playerStats.economy || 0} onChange={(e) => handleStatChange('economy', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-semibold text-slate-500 uppercase">Best Bowling</label>
        <input type="text" value={playerStats.best_bowling || '0/0'} onChange={(e) => handleStatChange('best_bowling', e.target.value)} placeholder="e.g. 5/20" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
    </>
  );

  const renderBasketballStats = () => (
    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Points / Game</label>
        <input type="number" step="0.1" value={playerStats.points_per_game || 0} onChange={(e) => handleStatChange('points_per_game', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Rebounds / Game</label>
        <input type="number" step="0.1" value={playerStats.rebounds_per_game || 0} onChange={(e) => handleStatChange('rebounds_per_game', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Assists / Game</label>
        <input type="number" step="0.1" value={playerStats.assists_per_game || 0} onChange={(e) => handleStatChange('assists_per_game', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Field Goal %</label>
        <input type="number" step="0.1" value={playerStats.field_goal_pct || 0} onChange={(e) => handleStatChange('field_goal_pct', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">3-Point %</label>
        <input type="number" step="0.1" value={playerStats.three_point_pct || 0} onChange={(e) => handleStatChange('three_point_pct', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
    </>
  );

  const renderFootballStats = () => (
    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Goals / Game</label>
        <input type="number" step="0.1" value={playerStats.goals_per_game || 0} onChange={(e) => handleStatChange('goals_per_game', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Assists / Game</label>
        <input type="number" step="0.1" value={playerStats.assists_per_game_fb || 0} onChange={(e) => handleStatChange('assists_per_game_fb', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Pass Accuracy %</label>
        <input type="number" step="0.1" value={playerStats.pass_accuracy || 0} onChange={(e) => handleStatChange('pass_accuracy', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Tackles / Game</label>
        <input type="number" step="0.1" value={playerStats.tackles_per_game || 0} onChange={(e) => handleStatChange('tackles_per_game', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Interceptions / Game</label>
        <input type="number" step="0.1" value={playerStats.interceptions_per_game || 0} onChange={(e) => handleStatChange('interceptions_per_game', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
    </>
  );

  
  const renderTennisStats = () => (
    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Aces</label>
        <input type="number" step="1" value={playerStats.aces || 0} onChange={(e) => handleStatChange('aces', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Win Pct %</label>
        <input type="number" step="0.1" value={playerStats.win_pct || 0} onChange={(e) => handleStatChange('win_pct', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
    </>
  );

  const renderBadmintonStats = () => (
    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Matches Won</label>
        <input type="number" step="1" value={playerStats.matches_won || 0} onChange={(e) => handleStatChange('matches_won', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
    </>
  );
  
  const renderVolleyballStats = () => (

    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Kills / Set</label>
        <input type="number" step="0.1" value={playerStats.kills_per_set || 0} onChange={(e) => handleStatChange('kills_per_set', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Blocks / Set</label>
        <input type="number" step="0.1" value={playerStats.blocks_per_set || 0} onChange={(e) => handleStatChange('blocks_per_set', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Digs / Set</label>
        <input type="number" step="0.1" value={playerStats.digs_per_set || 0} onChange={(e) => handleStatChange('digs_per_set', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Aces / Set</label>
        <input type="number" step="0.1" value={playerStats.aces_per_set || 0} onChange={(e) => handleStatChange('aces_per_set', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Hitting %</label>
        <input type="number" step="0.1" value={playerStats.hitting_pct || 0} onChange={(e) => handleStatChange('hitting_pct', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </div>
    </>
  );

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center mb-2">
              <Brain className="w-6 h-6 mr-2 text-indigo-300" />
              AI Performance Lab
            </h2>
            <p className="text-indigo-200 text-sm max-w-md">
              Powered by advanced computer vision and LLM analysis. Get insights into your match performance, technique, and strategic play.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center mb-4">
            <Video className="w-5 h-5 mr-2 text-rose-500" /> Match Analysis ({teamA} vs {teamB})
          </h3>
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative group mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                 <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
               </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1.5 rounded flex items-center justify-between">
              <span className="flex items-center"><Crosshair className="w-3 h-3 mr-1 text-rose-400" /> Tracking active</span>
              <span className="font-mono">14:22 / 45:00</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-rose-900 flex items-center mb-1">
                <FastForward className="w-4 h-4 mr-1 text-rose-500" /> Auto-Generated Highlights
              </h4>
              <p className="text-xs text-rose-700">
                Our AI detected 3 key moments in this match segment, including a crucial boundary and a dropped catch.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center mb-4">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" /> Match Context
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <div>
                <div className="text-sm text-slate-500 font-medium">Current Phase</div>
                <div className="text-lg font-bold text-slate-800">Middle Overs</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500 font-medium">Win Probability</div>
                <div className="text-lg font-bold text-emerald-600">62% {teamA}</div>
              </div>
            </div>
             <p className="text-sm italic font-serif leading-relaxed text-slate-700">
               {matchStats ? `The match is currently ${matchStats.runs}/${matchStats.wickets}. The run rate is looking steady as they look to build a strong total.` : "Waiting for live match context..."}
             </p>
             <div className="mt-3 text-xs text-emerald-600 font-mono">
               Generated via LLM + Whisper
             </div>
          </div>
        </div>
      </div>
      
      <PerformanceMetrics activeSport={activeSport} />

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" /> My {activeSport} Statistics
            </h3>
            <select 
              value={activeSport} 
              onChange={(e) => {
                setActiveSport(e.target.value);
                localStorage.setItem('activeSport', e.target.value);
              }}
              className="text-sm border-slate-200 rounded-md py-1 px-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
                            <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Basketball">Basketball</option>
              <option value="Tennis">Tennis</option>
              <option value="Pickleball">Pickleball</option>
              <option value="Hockey">Hockey</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Badminton">Badminton</option>
              <option value="Table Tennis">Table Tennis</option>
            </select>
          </div>
          <button 
            onClick={handleSaveStats}
            disabled={savingStats || !user}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {savingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save to Database</span>
          </button>
        </div>

        {!user ? (
          <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
            Please log in to view and save your performance statistics.
          </div>
        ) : loadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div>
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Matches</label>
                <input 
                  type="number" 
                  value={playerStats.matches || 0} 
                  onChange={(e) => handleStatChange('matches', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              {activeSport === 'Cricket' && renderCricketStats()}
              {activeSport === 'Basketball' && renderBasketballStats()}
              {activeSport === 'Football' && renderFootballStats()}
              {activeSport === 'Volleyball' && renderVolleyballStats()}
              {activeSport === 'Tennis' && renderTennisStats()}
              {activeSport === 'Badminton' && renderBadmintonStats()}
            </div>
            
            <div className="mt-4 text-xs text-slate-400 font-mono">
              Data is synced securely with Firestore `player_stats` collection.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}