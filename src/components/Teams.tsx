import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, ChevronRight, X, Loader2, Trash2, Heart, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';

interface Team {
  id: string;
  name: string;
  captainName: string | null;
  playersCount: number | null;
  winRate: string | null;
  sport_type?: string;
  city?: string;
  logoUrl?: string;
}

export function Teams({ activeSport }: { activeSport?: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [discoverTeams, setDiscoverTeams] = useState<Team[]>([]);
  const [teamSubTab, setTeamSubTab] = useState<'my' | 'discover'>('discover');
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', captainName: '', playersCount: 11, sport_type: 'Cricket', logoUrl: '' });
  
  useEffect(() => { 
    if (activeSport && activeSport !== 'All') {
      setNewTeam(prev => ({ ...prev, sport_type: activeSport }));
    }
  }, [activeSport]);

  const [loading, setLoading] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [newPlayerMobile, setNewPlayerMobile] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  const { user, userPreferences } = useAuth();
  const followedTeams = userPreferences?.followedTeams || [];

  const fetchRoster = async (teamId: string) => {
    try {
      const data: any = await dbService.getAll('players', { teamId: teamId });
      setRoster(Array.isArray(data) ? data : []);
    } catch (e) { 
      console.warn(e); 
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerMobile || !viewingTeam) return;
    try {
      setAddingPlayer(true);
      const p = await dbService.create('players', {
        name: 'New Player',
        mobileNumber: newPlayerMobile,
        teamId: viewingTeam.id,
        role: 'Player'
      });
      setRoster([...roster, p]);
      setNewPlayerMobile('');
    } catch(e) {
      console.warn(e);
    } finally {
      setAddingPlayer(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeams();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (teamSubTab === 'discover') {
      fetchDiscoverTeams();
    }
  }, [teamSubTab]);

  const fetchTeams = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data: any = await dbService.getAll('teams', { owner_id: user.uid });
      setTeams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoverTeams = async () => {
    try {
      setLoadingDiscover(true);
      const data: any = await dbService.getAll('teams');
      setDiscoverTeams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Failed to fetch discoverable teams", e);
    } finally {
      setLoadingDiscover(false);
    }
  };

  const toggleFollowTeam = async (teamName: string) => {
    if (!user) return;
    const isCurrentlyFollowed = followedTeams.includes(teamName);
    let updated;
    if (isCurrentlyFollowed) {
      updated = followedTeams.filter((t: string) => t !== teamName);
    } else {
      updated = [...followedTeams, teamName];
    }

    try {
      await dbService.update('profiles', user.uid, {
        preferences: {
          ...(userPreferences || {}),
          followedTeams: updated
        },
        followed_teams: updated
      });
    } catch (e) {
      console.warn("Failed to update profile preferences", e);
    }
  };

  const filteredTeams = teams.filter(t => 
    !activeSport || activeSport === 'All' ? true : (t.sport_type || 'Cricket') === activeSport
  );

  const filteredDiscoverTeams = discoverTeams.filter(t => {
    const matchesSport = !activeSport || activeSport === 'All' ? true : (t.sport_type || 'Cricket') === activeSport;
    const matchesSearch = t.name.toLowerCase().includes(discoverSearchQuery.toLowerCase()) || 
                          (t.captainName || '').toLowerCase().includes(discoverSearchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name || !user) return;
    
    try {
      setSubmitting(true);
      const newRecord = { ...newTeam, owner_id: user.uid, created_at: new Date().toISOString() };
      const created = await dbService.create('teams', newRecord);
      const finalRecord = created || newRecord;
      setTeams([finalRecord, ...teams]);
      setIsModalOpen(false);
      setNewTeam({ name: '', captainName: '', playersCount: 11, sport_type: activeSport && activeSport !== 'All' ? activeSport : 'Cricket', logoUrl: '' });
    } catch (e) {
      console.warn(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        const success = await dbService.remove('teams', id);
        if (success) {
          setTeams(teams.filter(t => t.id !== id));
        } else {
          alert("Failed to delete. You may not have permission.");
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Teams</h1>
          <p className="text-slate-600 mt-1">Manage squads, captains, and favorite teams</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-[#d11a2a] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors self-start sm:self-center"
        >
          <Plus className="w-5 h-5" />
          <span>Add Team</span>
        </button>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTeamSubTab('my')}
          className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-colors ${
            teamSubTab === 'my' 
              ? 'border-[#d11a2a] text-[#d11a2a]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Teams ({filteredTeams.length})
        </button>
        <button
          onClick={() => setTeamSubTab('discover')}
          className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-colors ${
            teamSubTab === 'discover' 
              ? 'border-[#d11a2a] text-[#d11a2a]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Discover & Follow Teams
        </button>
      </div>

      {teamSubTab === 'my' ? (
        loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#d11a2a] animate-spin" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Teams Yet</h3>
            <p className="text-slate-500 mt-1">Add your first team or check out Discover to follow active teams.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const isFollowed = followedTeams.includes(team.name);
              return (
                <div key={team.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="p-5 flex-1 relative">
                    <div className="absolute top-4 right-4 flex items-center space-x-1">
                      <button
                        onClick={() => toggleFollowTeam(team.name)}
                        className="p-1.5 rounded-full hover:bg-slate-50 border border-slate-100 shadow-sm transition-all"
                        title={isFollowed ? 'Unfollow Team' : 'Follow Team'}
                      >
                        <Heart className={`w-4 h-4 transition-transform hover:scale-110 ${isFollowed ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
                      </button>
                      <button 
                        onClick={() => handleDelete(team.id)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm transition-all"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {(team.logoUrl || (team as any).logo) ? (
                      <div className="w-12 h-12 rounded-full mb-4 overflow-hidden border border-slate-200">
                        <img src={team.logoUrl || (team as any).logo} alt={team.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-1.5">
                      <span>{team.name}</span>
                      {isFollowed && <span className="bg-red-100 text-[#d11a2a] text-[9px] px-1.5 py-0.5 rounded-full font-bold">FAVORITE</span>}
                    </h3>
                    <div className="text-sm text-slate-500 flex items-center">
                      <span className="font-medium text-slate-700 mr-1">Captain:</span> {team.captainName || 'TBA'}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 font-medium mb-1">Squad Size</div>
                        <div className="font-bold text-slate-900">{team.playersCount || 0}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 font-medium mb-1">Win Rate</div>
                        <div className="font-bold text-slate-900">{team.winRate || '0%'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-center mt-auto">
                    <button onClick={() => { setViewingTeam(team); fetchRoster(team.id); }} className="text-sm font-medium text-[#d11a2a] hover:text-red-700 flex items-center">
                      View Roster <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Discover Tab */
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={discoverSearchQuery}
              onChange={(e) => setDiscoverSearchQuery(e.target.value)}
              placeholder="Search all teams to follow..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
            />
          </div>

          {loadingDiscover ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-[#d11a2a] animate-spin" />
            </div>
          ) : filteredDiscoverTeams.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No Teams Found</h3>
              <p className="text-slate-500 mt-1">Try another search or create a team using the Add Team button.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDiscoverTeams.map((team) => {
                const isFollowed = followedTeams.includes(team.name);
                return (
                  <div key={team.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="p-5 flex-1 relative">
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={() => toggleFollowTeam(team.name)}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
                            isFollowed 
                              ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFollowed ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                          <span>{isFollowed ? 'Following' : 'Follow'}</span>
                        </button>
                      </div>

                      {(team.logoUrl || (team as any).logo) ? (
                      <div className="w-12 h-12 rounded-full mb-4 overflow-hidden border border-slate-200">
                        <img src={team.logoUrl || (team as any).logo} alt={team.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                      <h3 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-1.5">
                        <span>{team.name}</span>
                        {isFollowed && <span className="bg-red-100 text-[#d11a2a] text-[9px] px-1.5 py-0.5 rounded-full font-bold">FAVORITE</span>}
                      </h3>
                      <div className="text-sm text-slate-500 flex items-center">
                        <span className="font-medium text-slate-700 mr-1">Captain:</span> {team.captainName || 'TBA'}
                      </div>
                      {team.city && (
                        <div className="text-xs text-slate-400 mt-1">
                          City: {team.city}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-xs text-slate-500 font-medium mb-1">Squad Size</div>
                          <div className="font-bold text-slate-900">{team.playersCount || 0}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-xs text-slate-500 font-medium mb-1">Win Rate</div>
                          <div className="font-bold text-slate-900">{team.winRate || '0%'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-center mt-auto">
                      <button onClick={() => { setViewingTeam(team); fetchRoster(team.id); }} className="text-sm font-medium text-[#d11a2a] hover:text-red-700 flex items-center">
                        View Roster <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add New Team</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team Name *</label>
                <input 
                  type="text" 
                  required
                  value={newTeam.name}
                  onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. Mumbai Indians"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Captain Name</label>
                <input 
                  type="text" 
                  value={newTeam.captainName}
                  onChange={e => setNewTeam({...newTeam, captainName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. Rohit Sharma"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team Logo URL (Optional)</label>
                <input 
                  type="url" 
                  value={newTeam.logoUrl}
                  onChange={e => setNewTeam({...newTeam, logoUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Squad Size</label>
                <input 
                  type="number" 
                  min="1"
                  value={newTeam.playersCount}
                  onChange={e => setNewTeam({...newTeam, playersCount: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
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
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* Roster Modal */}
      {viewingTeam && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{viewingTeam.name} Roster</h2>
              <button onClick={() => setViewingTeam(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <form onSubmit={handleAddPlayer} className="flex space-x-2 mb-6">
                <input 
                  type="text" 
                  value={newPlayerMobile}
                  onChange={e => setNewPlayerMobile(e.target.value)}
                  placeholder="Player Mobile Number (e.g. +91...)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  required
                />
                <button 
                  type="submit"
                  disabled={addingPlayer}
                  className="bg-[#d11a2a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {addingPlayer ? 'Adding...' : 'Add Player'}
                </button>
              </form>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {roster.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No players added to this squad yet.</div>
                ) : (
                  roster.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.mobileNumber}</div>
                      </div>
                      <div className="text-xs font-medium bg-slate-200 text-slate-700 px-2 py-1 rounded">
                        {p.role}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
