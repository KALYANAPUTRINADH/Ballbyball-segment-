import { SportIcon } from '../components/SportIcon';
import React, { useState, useEffect } from 'react';
import { Trophy, ChevronLeft, Lock, MapPin, Calendar, Search, Plus, X, Loader2 } from 'lucide-react';
import { ProBadge } from "../components/ProBadge";
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';
import { TournamentManagement } from '../components/TournamentManagement';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { ShareButton } from '../components/ShareButton';
import { MatchMVPDisplay } from '../components/MatchMVPDisplay';
import { TournamentSchedule } from '../components/TournamentSchedule';

export default function TournamentHub({ setFullScreenView }: { setFullScreenView: (v: string | null) => void }) {
  const [viewMode, setViewMode] = useState<'tournaments' | 'schedule'>('tournaments');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const { user, isPro, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [proFeatureName, setProFeatureName] = useState("Create Tournament");
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (activeSport && activeSport !== 'All') {
      setNewTournament(prev => ({ ...prev, sport_type: activeSport }));
    }
  }, [activeSport]);

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
  
  const sports = ['All', 'Cricket', 'Football', 'Basketball', 'Tennis', 'Pickleball', 'Hockey', 'Volleyball', 'Badminton', 'Table Tennis'];

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data: any = await dbService.getAll('teams');
      setAvailableTeams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data: any = await dbService.getAll('tournaments');
      setTournaments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(t => 
    (activeSport === 'All' ? true : (t.sport_type || 'Cricket') === activeSport) &&
    (searchTerm === '' ? true : (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.teamNames || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedTournament) {
    return (
      <div className="bg-slate-50 min-h-screen">
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
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-20 shadow-md flex items-center space-x-3">
        <button onClick={() => setFullScreenView(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Tournament Hub</h1>
      </div>

      <div className="bg-white border-b border-slate-200">
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setViewMode('tournaments')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${viewMode === 'tournaments' ? 'border-[#d11a2a] text-[#d11a2a]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Tournaments
          </button>
          <button 
            onClick={() => {
              if (!isPro && !isAdmin) {
                setProFeatureName("Tournament Schedule");
                setIsProModalOpen(true);
              } else {
                setViewMode('schedule');
              }
            }}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center space-x-1 ${viewMode === 'schedule' ? 'border-[#d11a2a] text-[#d11a2a]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <span>Tournament Schedule</span>
            {!(isPro || isAdmin) && <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
        
        {viewMode === 'tournaments' && (
          <>
            <div className="flex items-center px-4 py-2 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text"
                placeholder="Search by name, team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
            <div className="flex overflow-x-auto hide-scrollbar p-2 space-x-2">
              {sports.map(sport => (
                <button
                  key={sport}
                  onClick={() => setActiveSport(sport)}
                  className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${
                    activeSport === sport ? 'bg-[#d11a2a] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <SportIcon sport={sport} className="w-3.5 h-3.5 mr-1" />
                  <span>{sport}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {viewMode === 'schedule' ? (
        <TournamentSchedule />
      ) : (
        <>
          <div className="p-4 flex justify-end">
            {user && (
              <button 
                onClick={() => {
                  if (!isPro && !isAdmin) {
                    setProFeatureName("Create Tournament");
                    setIsProModalOpen(true);
                  } else {
                    setIsModalOpen(true);
                  }
                }}
                className="flex items-center space-x-2 bg-[#d11a2a] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <ProBadge className="ml-0 mr-1" />
                <span className="hidden sm:inline">Create Tournament</span>
              </button>
            )}
          </div>
          <div className="p-4 pt-0">
            <MatchMVPDisplay />
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#d11a2a] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">No Tournaments Found</h3>
                <p className="text-slate-500 text-sm mt-1">Check back later for upcoming tournaments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTournaments.map(tournament => (
                  <div 
                    key={tournament.id} 
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTournament(tournament)}
                  >
                    <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex items-end justify-between relative">
                      <div>
                        <h3 className="text-white font-bold text-lg truncate pr-8">{tournament.name}</h3>
                        <span className="text-xs text-slate-300 font-medium">{tournament.sport_type || 'Cricket'} &bull; {tournament.format || 'League'}</span>
                      </div>
                      <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <ShareButton
                          title={`Tournament: ${tournament.name}`}
                          text="Check out the tournament!"
                          url={`${window.location.origin}/tournament/${tournament.id}`}
                          className="p-1 bg-white/10"
                        />
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tournament.status === 'Ongoing' ? 'bg-[#d11a2a] text-white animate-pulse' :
                          tournament.status === 'Completed' ? 'bg-slate-600 text-white' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {tournament.status || 'Upcoming'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between text-sm mb-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center text-slate-600">
                          <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                          <span className="truncate max-w-[120px]">{tournament.location || 'TBA'}</span>
                        </div>
                        <div className="flex items-center text-slate-600">
                          <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                          <span>{tournament.date || 'TBA'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-slate-500 font-medium text-xs block">TEAMS</span>
                          <span className="font-bold text-slate-900">{tournament.teamsCount || 0}</span>
                        </div>
                        <button className="text-sm font-bold text-[#d11a2a] bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                    {sports.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input 
                  type="text" 
                  value={newTournament.location}
                  onChange={e => setNewTournament({...newTournament, location: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. Lords Ground"
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
                      onChange={e => setNewTournament({...newTournament, teamsCount: parseInt(e.target.value)})}
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
        featureName={proFeatureName} 
      />
    </div>
  );
}
