import React, { useState, useEffect } from 'react';
import { User, Activity, TrendingUp, Award, Medal, Trophy, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';

export function PlayerDashboard({ activeSport }: { activeSport?: string }) {
  const { user, isPro, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const data = await dbService.get('player_stats', user.uid || 'guest');
        if (data) {
          setStats(data);
        } else {
          setStats({ matches: 0 });
        }
      } catch (err: any) {
        if (err.message && err.message.includes('offline')) { /* ignore */ } else { console.warn('Error fetching stats:', err); }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (!user) return <div className="p-4">Please log in to view performance.</div>;

  if (!(isPro || isAdmin)) {
    return (
      <div className="bg-slate-100 min-h-[600px] flex flex-col pb-20 justify-center items-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-bounce">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Unlock Your Performance Stats</h3>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Upgrade to PRO to unlock your own interactive performance dashboard, including detailed sports metrics, performance trends, and professional career insights.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openProModal', { detail: 'Performance Stats' }))}
            className="mt-6 w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10 transform hover:-translate-y-0.5"
          >
            <Lock className="w-4 h-4" />
            <span>Upgrade to Streamlify Pro</span>
          </button>
          <p className="text-[10px] text-slate-400 font-medium mt-3">Cancel anytime. Instant activation.</p>
        </div>
      </div>
    );
  }

  const displayName = user.displayName || 'Guest User';

  const sport = activeSport && activeSport !== 'All' ? activeSport : 'Cricket';

  const getQuickStats = () => {
    if (sport === 'Cricket') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'Runs', value: stats?.runs || 0 },
      { label: 'Avg', value: stats?.average || 0 },
      { label: 'Wickets', value: stats?.wickets || 0 }
    ];
    if (sport === 'Basketball') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'PPG', value: stats?.points_per_game || 0 },
      { label: 'RPG', value: stats?.rebounds_per_game || 0 },
      { label: 'APG', value: stats?.assists_per_game || 0 }
    ];
    if (sport === 'Football') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'Goals/G', value: stats?.goals_per_game || 0 },
      { label: 'Assists', value: stats?.assists_per_game_fb || 0 },
      { label: 'Acc %', value: stats?.pass_accuracy || 0 }
    ];
    if (sport === 'Volleyball') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'Kills/S', value: stats?.kills_per_set || 0 },
      { label: 'Blocks/S', value: stats?.blocks_per_set || 0 },
      { label: 'Digs/S', value: stats?.digs_per_set || 0 }
    ];
    return [{ label: 'Matches', value: stats?.matches || 0 }];
  };

  const getDetailedStats = () => {
    if (sport === 'Cricket') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'Innings', value: stats?.innings || 0 },
      { label: 'Runs', value: stats?.runs || 0 },
      { label: 'Highest Score', value: stats?.highest_score || 0 },
      { label: 'Batting Avg', value: stats?.average || 0 },
      { label: 'Strike Rate', value: stats?.strike_rate || 0 },
      { label: 'Hundreds', value: stats?.hundreds || 0 },
      { label: 'Fifties', value: stats?.fifties || 0 },
      { label: 'Wickets', value: stats?.wickets || 0 },
      { label: 'Best Bowling', value: stats?.best_bowling || '0/0' },
      { label: 'Economy', value: stats?.economy || 0 }
    ];
    if (sport === 'Basketball') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'Points / Game', value: stats?.points_per_game || 0 },
      { label: 'Rebounds / Game', value: stats?.rebounds_per_game || 0 },
      { label: 'Assists / Game', value: stats?.assists_per_game || 0 },
      { label: 'Field Goal %', value: stats?.field_goal_pct || 0 },
      { label: '3-Point %', value: stats?.three_point_pct || 0 }
    ];
    if (sport === 'Football') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'Goals / Game', value: stats?.goals_per_game || 0 },
      { label: 'Assists / Game', value: stats?.assists_per_game_fb || 0 },
      { label: 'Pass Accuracy %', value: stats?.pass_accuracy || 0 },
      { label: 'Tackles / Game', value: stats?.tackles_per_game || 0 },
      { label: 'Interceptions', value: stats?.interceptions_per_game || 0 }
    ];
    if (sport === 'Volleyball') return [
      { label: 'Matches', value: stats?.matches || 0 },
      { label: 'Kills / Set', value: stats?.kills_per_set || 0 },
      { label: 'Blocks / Set', value: stats?.blocks_per_set || 0 },
      { label: 'Digs / Set', value: stats?.digs_per_set || 0 },
      { label: 'Aces / Set', value: stats?.aces_per_set || 0 },
      { label: 'Hitting %', value: stats?.hitting_pct || 0 }
    ];
    return [{ label: 'Matches', value: stats?.matches || 0 }];
  };

  return (
    <div className="bg-slate-100 min-h-[600px] flex flex-col pb-20">
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white/20 rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden shrink-0">
             {user.photoURL ? (
               <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
             ) : (
               <span className="text-3xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
             )}
          </div>
          <div>
            <h1 className="text-2xl font-bold truncate">{displayName}</h1>
            <p className="text-red-100 text-sm mt-1">{user.phoneNumber || 'No phone linked'}</p>
          </div>
        </div>
        
        <div className="flex justify-between mt-6 bg-black/20 rounded-xl p-4 backdrop-blur-sm">
          {getQuickStats().map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-red-100 uppercase tracking-wide">{stat.label}</div>
              <div className="text-xl font-bold">{loading ? '-' : stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar bg-white shadow-sm mt-4 mx-4 rounded-xl border border-slate-200">
        {['Overview', 'Matches', 'Analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-semibold shrink-0 transition-colors ${
              activeTab === tab ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'Overview' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-teal-600" />
              {sport} Performance
            </h3>
            
            {loading ? (
              <div className="text-center py-4 text-slate-500 text-sm">Loading stats...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {getDetailedStats().map((stat, i) => (
                  <div key={i}><StatBox label={stat.label} value={String(stat.value)} /></div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab !== 'Overview' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center text-slate-500 text-sm">
            More details coming soon.
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-center">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
        {icon && <span className="mr-1.5">{icon}</span>}
        {label}
      </div>
      <div className="text-lg font-black text-slate-800">{value}</div>
    </div>
  );
}
