import React, { useState, useEffect } from 'react';
import { Trophy, Plus, MapPin, Calendar, ChevronRight, X, Loader2, Trash2, Heart, Search } from 'lucide-react';
import { ProBadge } from "../components/ProBadge";
import { TournamentManagement } from './TournamentManagement';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';
import { ProUpgradeModal } from './ProUpgradeModal';
import { LocationSearchInput } from './LocationSearchInput';

interface Tournament {
  id: number;
  name: string;
  location: string | null;
  date: string | null;
  status: string | null;
  teamsCount: number | null;
  sport_type?: string;
  ball_type?: string;
  format?: string;
  banner_url?: string;
  officials?: any;
  organisers?: any;
  umpires?: any;
  teams?: any;
  teamNames?: string;
}

export function Tournaments({ activeSport, setFullScreenView }: { activeSport?: string; setFullScreenView?: (v: string | null) => void }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [discoverTournaments, setDiscoverTournaments] = useState<Tournament[]>([]);
  const [tournamentSubTab, setTournamentSubTab] = useState<'my' | 'discover'>('discover');
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({ 
    name: '', location: '', date: '', teamsCount: 4,
    sport_type: 'Cricket', format: 'League', ball_type: 'Leather',
    banner_url: '',
    officials: { name: '', number: '' },
    organisers: { name: '', number: '' },
    umpires: { name: '' },
    teamNames: '',
    entryFee: 0,
    paymentGateway: 'none'
  });
  const [loading, setLoading] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const { user, isPro, isAdmin, userPreferences } = useAuth();
  const followedTournaments = userPreferences?.followedTournaments || [];

  useEffect(() => {
    if (activeSport && activeSport !== 'All') {
      setNewTournament(prev => ({ ...prev, sport_type: activeSport }));
    }
  }, [activeSport]);

  useEffect(() => {
    if (user) {
      fetchTournaments();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tournamentSubTab === 'discover') {
      fetchDiscoverTournaments();
    }
  }, [tournamentSubTab]);

  const fetchTeams = async () => {
    try {
      const data: any = await dbService.getAll('teams');
      setAvailableTeams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchTournaments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data: any = await dbService.getAll('tournaments', { owner_id: user.uid });
      setTournaments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoverTournaments = async () => {
    try {
      setLoadingDiscover(true);
      const data: any = await dbService.getAll('tournaments');
      setDiscoverTournaments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Failed to fetch discoverable tournaments", e);
    } finally {
      setLoadingDiscover(false);
    }
  };

  const toggleFollowTournament = async (tournamentName: string) => {
    if (!user) return;
    const isCurrentlyFollowed = followedTournaments.includes(tournamentName);
    let updated;
    if (isCurrentlyFollowed) {
      updated = followedTournaments.filter((t: string) => t !== tournamentName);
    } else {
      updated = [...followedTournaments, tournamentName];
    }

    try {
      await dbService.update('profiles', user.uid, {
        preferences: {
          ...(userPreferences || {}),
          followedTournaments: updated
        },
        followed_tournaments: updated
      });
    } catch (e) {
      console.warn("Failed to update tournament follow preferences", e);
    }
  };

  const filteredTournaments = tournaments.filter(t => 
    !activeSport || activeSport === 'All' ? true : (t.sport_type || 'Cricket') === activeSport
  );

  const filteredDiscoverTournaments = discoverTournaments.filter(t => {
    const matchesSport = !activeSport || activeSport === 'All' ? true : (t.sport_type || 'Cricket') === activeSport;
    const matchesSearch = t.name.toLowerCase().includes(discoverSearchQuery.toLowerCase()) || 
                          (t.location || '').toLowerCase().includes(discoverSearchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournament.name || !user) return;
    
    try {
      setSubmitting(true);
      const newRecord = { ...newTournament, owner_id: user.uid, created_at: new Date().toISOString(), id: Date.now() };
      const created = await dbService.create('tournaments', newRecord);
      const finalRecord = created || newRecord;
      setTournaments([finalRecord, ...tournaments]);
      setIsModalOpen(false);
      setNewTournament({ 
        name: '', location: '', date: '', teamsCount: 4,
        sport_type: activeSport && activeSport !== 'All' ? activeSport : 'Cricket', format: 'League', ball_type: 'Leather',
        banner_url: '',
        officials: { name: '', number: '' },
        organisers: { name: '', number: '' },
        umpires: { name: '' },
        teamNames: '',
        entryFee: 0,
        paymentGateway: 'none'
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this tournament?")) {
      try {
        const success = await dbService.remove('tournaments', id.toString());
        if (success) {
          setTournaments(tournaments.filter(t => t.id !== id));
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
      {selectedTournament ? (
        <TournamentManagement 
          tournament={selectedTournament}
          tournamentName={selectedTournament.name} 
          onBack={() => setSelectedTournament(null)} 
          setFullScreenView={setFullScreenView}
          onUpdate={(updated) => {
            setTournaments(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTournament(updated);
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Tournaments</h1>
              <p className="text-slate-600 mt-1">Manage leagues, knockouts, and favorite tournaments</p>
            </div>
            <button 
              onClick={() => {
                if (!isPro && !isAdmin) {
                  setIsProModalOpen(true);
                } else {
                  setIsModalOpen(true);
                }
              }}
              className="flex items-center space-x-2 bg-[#d11a2a] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors self-start sm:self-center"
            >
              <Plus className="w-5 h-5" />
              <ProBadge className="ml-0 mr-1" />
              <span>Create Tournament</span>
            </button>
          </div>

          {/* Sub-Tabs Control */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTournamentSubTab('my')}
              className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-colors ${
                tournamentSubTab === 'my' 
                  ? 'border-[#d11a2a] text-[#d11a2a]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              My Tournaments ({filteredTournaments.length})
            </button>
            <button
              onClick={() => setTournamentSubTab('discover')}
              className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-colors ${
                tournamentSubTab === 'discover' 
                  ? 'border-[#d11a2a] text-[#d11a2a]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Discover & Follow Tournaments
            </button>
          </div>

          {tournamentSubTab === 'my' ? (
            loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-[#d11a2a] animate-spin" />
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No Tournaments Yet</h3>
                <p className="text-slate-500 mt-1">Create your first tournament or discover existing ones to follow.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((tournament) => {
                  const isFollowed = followedTournaments.includes(tournament.name);
                  return (
                    <div key={tournament.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex items-end justify-between relative">
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <button
                            onClick={() => toggleFollowTournament(tournament.name)}
                            className="text-white/70 hover:text-red-500 bg-black/30 hover:bg-white p-1.5 rounded-full transition-colors"
                            title={isFollowed ? 'Unfollow' : 'Follow'}
                          >
                            <Heart className={`w-4 h-4 ${isFollowed ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                          </button>
                          <button 
                            onClick={() => handleDelete(tournament.id)}
                            className="text-white/50 hover:text-white bg-black/20 hover:bg-red-500 rounded-full p-1.5 transition-colors"
                            title="Delete Tournament"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg truncate pr-16">{tournament.name}</h3>
                          <span className="text-xs text-slate-300 font-medium">
                            {tournament.sport_type || 'Cricket'} &bull; {tournament.format || 'League'}
                            {isFollowed && <span className="ml-2 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase">FAVORITE</span>}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                            tournament.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                            tournament.status === 'Upcoming' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {tournament.status || 'Upcoming'}
                          </span>
                          <span className="text-slate-500 font-medium">{tournament.teamsCount || 0} Teams</span>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center text-slate-600 text-sm">
                            <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                            <span className="truncate">{tournament.location || 'TBA'}</span>
                          </div>
                          <div className="flex items-center text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                            <span>{tournament.date || 'TBA'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-center">
                        <button onClick={() => setSelectedTournament(tournament)} className="text-sm font-medium text-[#d11a2a] hover:text-red-700 flex items-center">
                          Manage Tournament <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Discover & Follow Tournaments Tab */
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={discoverSearchQuery}
                  onChange={(e) => setDiscoverSearchQuery(e.target.value)}
                  placeholder="Search all tournaments to follow..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>

              {loadingDiscover ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 text-[#d11a2a] animate-spin" />
                </div>
              ) : filteredDiscoverTournaments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                  <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No Tournaments Found</h3>
                  <p className="text-slate-500 mt-1">Try another search or create a new tournament.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDiscoverTournaments.map((tournament) => {
                    const isFollowed = followedTournaments.includes(tournament.name);
                    return (
                      <div key={tournament.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex items-end justify-between relative">
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => toggleFollowTournament(tournament.name)}
                              className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-bold transition-all shadow-sm ${
                                isFollowed 
                                  ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                                  : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${isFollowed ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                              <span>{isFollowed ? 'Following' : 'Follow'}</span>
                            </button>
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg truncate pr-16">{tournament.name}</h3>
                            <span className="text-xs text-slate-300 font-medium">
                              {tournament.sport_type || 'Cricket'} &bull; {tournament.format || 'League'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-sm">
                            <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                              tournament.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                              tournament.status === 'Upcoming' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {tournament.status || 'Upcoming'}
                            </span>
                            <span className="text-slate-500 font-medium">{tournament.teamsCount || 0} Teams</span>
                          </div>
                          
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center text-slate-600 text-sm">
                              <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                              <span className="truncate">{tournament.location || 'TBA'}</span>
                            </div>
                            <div className="flex items-center text-slate-600 text-sm">
                              <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                              <span>{tournament.date || 'TBA'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-center">
                          <button onClick={() => setSelectedTournament(tournament)} className="text-sm font-medium text-[#d11a2a] hover:text-red-700 flex items-center">
                            Manage Tournament <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create New Tournament</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tournament Name *</label>
                <input 
                  type="text" required
                  value={newTournament.name}
                  onChange={e => setNewTournament({...newTournament, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. Winter Cup 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sport Type</label>
                  <select
                    value={newTournament.sport_type}
                    onChange={e => setNewTournament({...newTournament, sport_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  >
                    <option>Cricket</option>
                    <option>Football</option>
                    <option>Basketball</option>
                    <option>Tennis</option>
                    <option>Pickleball</option>
                    <option>Hockey</option>
                    <option>Volleyball</option>
                    <option>Badminton</option>
                    <option>Table Tennis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                  <select
                    value={newTournament.format}
                    onChange={e => setNewTournament({...newTournament, format: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  >
                    <option>League</option>
                    <option>Knockout</option>
                    <option>Group + Knockout</option>
                    <option>Final</option>
                  </select>
                </div>
              </div>

              {newTournament.sport_type === 'Cricket' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ball Type</label>
                  <select
                    value={newTournament.ball_type}
                    onChange={e => setNewTournament({...newTournament, ball_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  >
                    <option>Leather</option>
                    <option>Tennis</option>
                    <option>Others</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organiser Name</label>
                  <input type="text"
                    value={newTournament.organisers.name}
                    onChange={e => setNewTournament({...newTournament, organisers: {...newTournament.organisers, name: e.target.value}})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organiser Number</label>
                  <input type="text"
                    value={newTournament.organisers.number}
                    onChange={e => setNewTournament({...newTournament, organisers: {...newTournament.organisers, number: e.target.value}})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Official Name</label>
                  <input type="text"
                    value={newTournament.officials.name}
                    onChange={e => setNewTournament({...newTournament, officials: {...newTournament.officials, name: e.target.value}})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Official Number</label>
                  <input type="text"
                    value={newTournament.officials.number}
                    onChange={e => setNewTournament({...newTournament, officials: {...newTournament.officials, number: e.target.value}})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Umpire / Referee Name</label>
                <input type="text"
                  value={newTournament.umpires.name}
                  onChange={e => setNewTournament({...newTournament, umpires: {name: e.target.value}})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                />
              </div>
              
              <div className="relative z-50">
                <label className="block text-sm font-medium text-slate-700 mb-1">Add Teams (Search or type comma separated)</label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => {
                      setTeamSearch(e.target.value);
                      setShowTeamDropdown(true);
                    }}
                    onFocus={() => setShowTeamDropdown(true)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    placeholder="Search teams to add..."
                  />
                  {showTeamDropdown && teamSearch && availableTeams && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {availableTeams
                        .filter(team => (team.name || '').toLowerCase().includes(teamSearch.toLowerCase()))
                        .map(team => (
                          <div
                            key={team.id}
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-800"
                            onClick={() => {
                              const currentTeams = newTournament.teamNames ? newTournament.teamNames.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                              if (!currentTeams.includes(team.name)) {
                                currentTeams.push(team.name);
                                setNewTournament({ ...newTournament, teamNames: currentTeams.join(', ') });
                              }
                              setTeamSearch('');
                              setShowTeamDropdown(false);
                            }}
                          >
                            {team.name}
                          </div>
                      ))}
                      {availableTeams.filter(team => (team.name || '').toLowerCase().includes(teamSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-sm text-slate-500">No teams found matching "{teamSearch}"</div>
                      )}
                    </div>
                  )}
                </div>
                <textarea 
                  value={newTournament.teamNames}
                  onChange={e => setNewTournament({...newTournament, teamNames: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. Royal Warriors, Cypher XI, Amigos"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image URL</label>
                <input type="url"
                  value={newTournament.banner_url}
                  onChange={e => setNewTournament({...newTournament, banner_url: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
              
              <div>
                <LocationSearchInput
                  label="Location"
                  value={newTournament.location}
                  onChange={(val) => setNewTournament({ ...newTournament, location: val })}
                  placeholder="Search US city, state, or stadium (e.g. Dallas, TX)..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={newTournament.date}
                    onChange={e => setNewTournament({...newTournament, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teams Count</label>
                  <input 
                    type="number" min="2" max="64"
                    value={newTournament.teamsCount}
                    onChange={e => setNewTournament({...newTournament, teamsCount: parseInt(e.target.value) || 4})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Entry Fee</label>
                  <input 
                    type="number" min="0"
                    value={newTournament.entryFee}
                    onChange={e => setNewTournament({...newTournament, entryFee: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    placeholder="e.g. 1500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Gateway</label>
                  <select
                    value={newTournament.paymentGateway}
                    onChange={e => setNewTournament({...newTournament, paymentGateway: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  >
                    <option value="none">None (Offline)</option>
                    <option value="razorpay">Razorpay (INR)</option>
                    <option value="stripe">Stripe (USD)</option>
                  </select>
                </div>
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
                  className="flex-1 px-4 py-2 text-white bg-[#d11a2a] hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ProUpgradeModal 
        isOpen={isProModalOpen} 
        onClose={() => setIsProModalOpen(false)} 
        featureName="Create Tournament" 
      />
    </div>
  );
}
