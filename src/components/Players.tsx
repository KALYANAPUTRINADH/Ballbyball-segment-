import React, { useState, useEffect } from 'react';
import { User, Plus, Search, Filter, Activity, TrendingUp, X, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';

interface Player {
  mobileNumber?: string | null;
  id: string;
  name: string;
  role: string | null;
  teamId: number | null;
  matches: number | null;
  runs: number | null;
  wickets: number | null;
  average: string | null;
  strikeRate: string | null;
}

export function Players({ activeSport }: { activeSport?: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', mobileNumber: '', role: 'Player', teamId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data: any = await dbService.getAll('players');
      setPlayers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name || !user) return;
    
    try {
      setSubmitting(true);
      const newRecord = { ...newPlayer, owner_id: user.uid, created_at: new Date().toISOString() };
      const created = await dbService.create('players', newRecord);
      const finalRecord = created || newRecord;
      setPlayers([finalRecord, ...(Array.isArray(players) ? players : [])]);
      setIsModalOpen(false);
      setNewPlayer({ name: '', mobileNumber: '', role: 'Player', teamId: '' });
    } catch (e) {
      console.warn(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this player?")) {
      try {
        const success = await dbService.remove('players', id);
        if (success) {
          setPlayers((Array.isArray(players) ? players : []).filter(p => p.id !== id));
        } else {
          alert("Failed to delete. You may not have permission.");
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const filteredPlayers = (Array.isArray(players) ? players : []).filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.role && player.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (player.mobileNumber && player.mobileNumber.includes(searchQuery))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Players Database</h1>
          <p className="text-slate-600 mt-1">Manage player profiles and track performance</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-[#d11a2a] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Player</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search players by name or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] shadow-sm"
          />
        </div>
        <button className="flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm font-medium">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-[#d11a2a] animate-spin" />
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No Players Found</h3>
          <p className="text-slate-500 mt-1">
            {searchQuery ? 'Try adjusting your search query.' : 'Add your first player to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Player Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Team ID</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('openPlayerProfile', { detail: { id: player.id, name: player.name, displayName: player.name, role: player.role } }))}>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs mr-3">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{player.name}</div>
                          <div className="text-xs text-slate-500 sm:hidden mt-0.5">{player.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        player.role === 'Batsman' ? 'bg-blue-50 text-blue-700' :
                        player.role === 'Bowler' ? 'bg-green-50 text-green-700' :
                        player.role === 'All-Rounder' ? 'bg-purple-50 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {player.role || 'Player'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm hidden md:table-cell">
                      {player.teamId ? `#${player.teamId}` : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(player.id); }}
                        className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add New Player</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Player Name *</label>
                <input 
                  type="text" 
                  required
                  value={newPlayer.name}
                  onChange={e => setNewPlayer({...newPlayer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. Virat Kohli"
                />
              </div>
              
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number (Optional)</label>
                <input 
                  type="tel" 
                  value={newPlayer.mobileNumber}
                  onChange={e => setNewPlayer({...newPlayer, mobileNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  value={newPlayer.role}
                  onChange={e => setNewPlayer({...newPlayer, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] bg-white"
                >
                  <optgroup label="General">
                    <option value="Player">Player</option>
                    <option value="Captain">Captain</option>
                    <option value="Coach">Coach</option>
                  </optgroup>
                  <optgroup label="Cricket">
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </optgroup>
                  <optgroup label="Football / Hockey">
                    <option value="Forward">Forward</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </optgroup>
                  <optgroup label="Basketball">
                    <option value="Point Guard">Point Guard</option>
                    <option value="Shooting Guard">Shooting Guard</option>
                    <option value="Small Forward">Small Forward</option>
                    <option value="Power Forward">Power Forward</option>
                    <option value="Center">Center</option>
                  </optgroup>
                  <optgroup label="Racquet Sports">
                    <option value="Singles Player">Singles Player</option>
                    <option value="Doubles Player">Doubles Player</option>
                  </optgroup>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team ID (Optional)</label>
                <input 
                  type="number" 
                  value={newPlayer.teamId}
                  onChange={e => setNewPlayer({...newPlayer, teamId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. 1"
                />
              </div>
              
              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-white bg-[#d11a2a] hover:bg-red-700 rounded-lg font-medium transition-colors flex justify-center items-center disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
