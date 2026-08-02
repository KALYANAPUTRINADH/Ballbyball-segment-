import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, MapPin, Activity, Calendar, Trophy, Medal, Target } from 'lucide-react';
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';

export default function PlayerProfile({ player, onBack }: { player: any, onBack: () => void }) {
  const { user: currentUser, isPro, isAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const isPublic = player.is_public !== false;
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data: any = await dbService.get('performance_stats', player.id || 'guest');
        
        if (data && Object.keys(data).length > 2) {
          setStats({
            Cricket: [
              { label: 'Matches', value: data.matches || 0 },
              { label: 'Runs', value: data.runs || 0 },
              { label: 'Wickets', value: data.wickets || 0 },
              { label: 'Highest Score', value: data.highest_score || 0 }
            ]
          });
        } else {
          setStats(null);
        }
      } catch (err: any) {
        if (err.message && err.message.includes('offline')) { /* ignore */ } else { console.warn('Error fetching stats:', err); }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [player.id]);

  const displayName = player.displayName || player.name || player.full_name || player.username || 'Unknown Player';

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="bg-teal-600 text-white h-16 flex items-center px-4 shrink-0 shadow-sm sticky top-0 z-20">
        <button onClick={onBack} className="mr-3 p-1 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg truncate flex-1">Player Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-6 shadow-sm border-b border-slate-100 mb-2">
          <div className="flex flex-col items-center">
            {player.photoURL ? (
              <img src={player.photoURL} alt={displayName} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center shadow-md mb-4 border-4 border-slate-100">
                <span className="text-4xl font-bold text-teal-700">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}

            <div className="flex space-x-6 mt-4 mb-2">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-slate-900">{player.followers_count || (isFollowing ? 1 : 0)}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-slate-900">{player.following_count || 0}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Following</span>
              </div>
            </div>
            {currentUser?.uid !== player.id && (
              <button 
                onClick={() => setIsFollowing(!isFollowing)}
                className={`mt-4 px-8 py-2 rounded-full font-bold text-sm transition-colors ${isFollowing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center mt-4">{displayName}</h2>
            <div className="flex items-center text-slate-500 text-sm mt-2 font-medium">
              <Phone size={14} className="mr-1.5 text-slate-400" /> {player.phoneNumber || player.phone || 'No phone number'}
            </div>
            {player.location && (
              <div className="flex items-center text-slate-500 text-sm mt-1 font-medium">
                <MapPin size={14} className="mr-1.5 text-slate-400" /> {player.location}
              </div>
            )}
          </div>
        </div>

        {!isPublic && currentUser?.uid !== player.id ? (
          <div className="bg-white p-12 shadow-sm text-center">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <User className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-1">This Profile is Private</h3>
             <p className="text-sm text-slate-500">Only approved followers can see what they share.</p>
          </div>
        ) : (
          <div className="bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-teal-600" />
                Career Stats
              </h3>
            </div>

            {!(isPro || isAdmin) && currentUser?.uid !== player.id ? (
              <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-slate-100">
                <Trophy className="w-10 h-10 text-slate-300 mb-3" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Advanced Statistics Locked</h2>
                <p className="text-slate-500 text-sm mb-4 max-w-sm">Upgrade to PRO to unlock advanced career stats, performance insights, and historical tracking for all players.</p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('openProModal', { detail: 'Career Stats' }))} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition-colors text-sm shadow-md shadow-indigo-200"
                >
                  Unlock Pro
                </button>
              </div>
            ) : loading ? (
              <div className="py-8 text-center text-slate-500">Loading stats...</div>
            ) : stats ? (
              <div className="space-y-8">
                {Object.entries(stats).map(([sportName, sportStats]: [string, any]) => (
                  <div key={sportName}>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-slate-400" />
                      {sportName}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sportStats.map((stat: any, idx: number) => (
                        <StatBox key={idx} label={stat.label} value={stat.value} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">No career stats available yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const StatBox: React.FC<{ label: string, value: string | number, icon?: React.ReactNode }> = ({ label, value, icon }) => {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-center">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
        {icon && <span className="mr-1.5">{icon}</span>}
        {label}
      </div>
      <div className="text-xl font-black text-slate-800">{value}</div>
    </div>
  );
};
