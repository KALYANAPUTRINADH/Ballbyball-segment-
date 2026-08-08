import { dbService } from '../lib/database';

import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Shield, Loader2, Camera, Video, EyeOff, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CountryCodeSelect } from '../components/CountryCodeSelect';

const StartMatch = ({ setFullScreenView }: { setFullScreenView: (v: string | null) => void }) => {
  const [teamSize, setTeamSize] = useState(11);
  const [subsCount, setSubsCount] = useState(1);
  const [sportType, setSportType] = useState(() => {
    const prefillSport = localStorage.getItem('prefill_sport_type');
    if (prefillSport) return prefillSport;
    return localStorage.getItem('activeSport') && localStorage.getItem('activeSport') !== 'All' ? localStorage.getItem('activeSport')! : 'Cricket';
  });
  const [teamA, setTeamA] = useState<string | null>(() => localStorage.getItem('prefill_team_a') || null);
  const [matchFormat, setMatchFormat] = useState('T20');
  const [overs, setOvers] = useState('20');
  const [location, setLocation] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossChoice, setTossChoice] = useState<'Bat' | 'Bowl'>('Bat');
  const [striker, setStriker] = useState('Player 1');
  const [nonStriker, setNonStriker] = useState('Player 2');
  const [nextBatsman, setNextBatsman] = useState('Player 3');
  const [bowler, setBowler] = useState('Player 11');
  const [liveStreamOption, setLiveStreamOption] = useState<'mobile' | 'professional' | 'none'>('none');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [teamAPlaying11, setTeamAPlaying11] = useState<string[]>(Array.from({length: 11}, (_, i) => `Player A${i+1}`));
  const [teamBPlaying11, setTeamBPlaying11] = useState<string[]>(Array.from({length: 11}, (_, i) => `Player B${i+1}`));
  const [squadModalTeam, setSquadModalTeam] = useState<'A' | 'B' | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [umpires, setUmpires] = useState(['', '']);
  const [scorer, setScorer] = useState('');
  const [referee, setReferee] = useState('');
  const [teamB, setTeamB] = useState<string | null>(() => localStorage.getItem('prefill_team_b') || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'A' | 'B'>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    let newSize = 11;
    let newSubs = 0;
    if (sportType === 'Cricket') { newSize = 11; newSubs = 1; }
    else if (sportType === 'Football' || sportType === 'Hockey') { newSize = 11; newSubs = 5; }
    else if (sportType === 'Basketball') { newSize = 5; newSubs = 5; }
    else if (sportType === 'Volleyball') { newSize = 6; newSubs = 6; }
    else if (sportType === 'Tennis' || sportType === 'Badminton' || sportType === 'Table Tennis' || sportType === 'Pickleball') { newSize = 1; newSubs = 0; }
    else { newSize = 5; newSubs = 0; }
    
    setTeamSize(newSize);
    setSubsCount(newSubs);
    setTeamAPlaying11(Array.from({length: newSize + newSubs}, (_, i) => `Player A${i+1}`));
    setTeamBPlaying11(Array.from({length: newSize + newSubs}, (_, i) => `Player B${i+1}`));
  }, [sportType]);

  const [searchPlayerModal, setSearchPlayerModal] = useState<{ index: number, open: boolean, query: string, results: any[], searching: boolean }>({ index: -1, open: false, query: '', results: [], searching: false });
  const [searchPlayerCountryCode, setSearchPlayerCountryCode] = useState('+91');

  const handleSearchPlayer = async () => {
    if (!searchPlayerModal.query.trim()) return;
    setSearchPlayerModal(prev => ({ ...prev, searching: true, results: [] }));
    try {
      const searchPhone = (searchPlayerCountryCode + ' ' + searchPlayerModal.query.trim()).replace(/\s+/g, '');
      const allProfiles = await dbService.getAll('profiles');
      const res = allProfiles.filter((p: any) => p.phone && p.phone.replace(/\s+/g, '').includes(searchPhone.replace('+', '')));
      setSearchPlayerModal(prev => ({ ...prev, results: res, searching: false }));
    } catch (e) {
      console.warn(e);
      setSearchPlayerModal(prev => ({ ...prev, searching: false }));
    }
  };

  const selectPlayer = (name: string) => {
    const { index } = searchPlayerModal;
    if (index === -1) return;
    if (squadModalTeam === 'A') {
      const newSquad = [...teamAPlaying11];
      newSquad[index] = name;
      setTeamAPlaying11(newSquad);
    } else if (squadModalTeam === 'B') {
      const newSquad = [...teamBPlaying11];
      newSquad[index] = name;
      setTeamBPlaying11(newSquad);
    }
    setSearchPlayerModal({ index: -1, open: false, query: '', results: [], searching: false });
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        if (user) {
          const data = await dbService.getAll('teams');
          const allTeams = Array.isArray(data) ? data : [];
          // Sort teams: user's own teams first, then other teams alphabetically
          const sortedTeams = [...allTeams].sort((a: any, b: any) => {
            const aOwn = a.owner_id === user.uid;
            const bOwn = b.owner_id === user.uid;
            if (aOwn && !bOwn) return -1;
            if (!aOwn && bOwn) return 1;
            return (a.name || '').localeCompare(b.name || '');
          });
          setTeams(sortedTeams);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchTeams();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSquadPlayerChange = (index: number, val: string) => {
    if (squadModalTeam === 'A') {
      const newSquad = [...teamAPlaying11];
      newSquad[index] = val;
      setTeamAPlaying11(newSquad);
    } else if (squadModalTeam === 'B') {
      const newSquad = [...teamBPlaying11];
      newSquad[index] = val;
      setTeamBPlaying11(newSquad);
    }
  };

  const handleSelect = async (name: string, isNew: boolean = false) => {
    if (selectingFor === 'A') {
      setTeamA(name);
    } else {
      setTeamB(name);
    }
    setIsModalOpen(false);
    
    if (isNew && user) {
      try {
        await dbService.create('teams', {
          name,
          city: 'Unknown',
          owner_id: user.uid,
          sport_type: sportType,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Failed to create team:", e);
      }
    }
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-20 md:pb-6 hide-scrollbar relative">
      <div className="bg-[#d11a2a] text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-lg font-bold">Start a Match</h1>
        <p className="text-xs opacity-90">Configure match details</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Sport Type */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Sport</h2>
          <select 
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
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

        {/* Teams Section */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Teams</h2>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { setSelectingFor('A'); setIsModalOpen(true); }}
              className="flex-1 bg-slate-50 border border-slate-200 py-3 rounded-lg flex flex-col items-center justify-center hover:bg-slate-100 transition-colors"
            >
              {teamA ? (
                <span className="font-bold text-slate-800 text-sm">{teamA}</span>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mb-1">
                    <Plus className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Select Team A</span>
                </>
              )}
            </button>

            <span className="text-sm font-bold text-slate-400">VS</span>

            <button 
              onClick={() => { setSelectingFor('B'); setIsModalOpen(true); }}
              className="flex-1 bg-slate-50 border border-slate-200 py-3 rounded-lg flex flex-col items-center justify-center hover:bg-slate-100 transition-colors"
            >
              {teamB ? (
                <span className="font-bold text-slate-800 text-sm">{teamB}</span>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mb-1">
                    <Plus className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Select Team B</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Match Settings Button */}
        {teamA && teamB && (
          <button 
            onClick={() => setSettingsModalOpen(true)}
            className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex flex-col items-start">
              <span className="font-bold text-slate-800">Match Settings</span>
              <span className="text-xs text-slate-500">Configure Venue, Officials & Rules</span>
            </div>
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        )}

        {/* Squad Settings */}
        {(teamA && teamB) && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 mb-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Squad Settings</h2>
            <div className="flex gap-4">
               <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Players per Team</label>
                  <input
                    type="number"
                    value={teamSize}
                    onChange={(e) => {
                       const val = parseInt(e.target.value) || 1;
                       setTeamSize(val);
                       setTeamAPlaying11(Array.from({length: val + subsCount}, (_, i) => teamAPlaying11[i] || `Player A${i+1}`));
                       setTeamBPlaying11(Array.from({length: val + subsCount}, (_, i) => teamBPlaying11[i] || `Player B${i+1}`));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                  />
               </div>
               <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{sportType === 'Cricket' ? '12th Man / Extras' : 'Substitutes'}</label>
                  <input
                    type="number"
                    value={subsCount}
                    onChange={(e) => {
                       const val = parseInt(e.target.value) || 0;
                       setSubsCount(val);
                       setTeamAPlaying11(Array.from({length: teamSize + val}, (_, i) => teamAPlaying11[i] || `Player A${i+1}`));
                       setTeamBPlaying11(Array.from({length: teamSize + val}, (_, i) => teamBPlaying11[i] || `Player B${i+1}`));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                  />
               </div>
            </div>
          </div>
        )}
        
        {/* Playing Squads */}
        {(teamA && teamB) && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
             <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Playing Squads</h2>
             <div className="flex gap-4">
                <button 
                  onClick={() => setSquadModalTeam('A')}
                  className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100"
                >
                  Configure {teamA} Squad
                </button>
                <button 
                  onClick={() => setSquadModalTeam('B')}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100"
                >
                  Configure {teamB} Squad
                </button>
             </div>
          </div>
        )}

        {/* Opening Players */}
        {(teamA && teamB && sportType === 'Cricket') && (() => {
          const isTeamABatting = (tossWinner === 'A' && tossChoice === 'Bat') || (tossWinner === 'B' && tossChoice === 'Bowl');
          const battingSquad = isTeamABatting ? teamAPlaying11 : teamBPlaying11;
          const bowlingSquad = isTeamABatting ? teamBPlaying11 : teamAPlaying11;
          return (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Opening Players</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Striker (Batter)</label>
                <select 
                  value={striker} 
                  onChange={(e) => setStriker(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                >
                  <option value={striker}>{striker}</option>
                  {battingSquad.filter(p => p !== striker && p !== nonStriker && p !== bowler).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Non-Striker (Batter)</label>
                <select 
                  value={nonStriker} 
                  onChange={(e) => setNonStriker(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                >
                  <option value={nonStriker}>{nonStriker}</option>
                  {battingSquad.filter(p => p !== striker && p !== nonStriker && p !== bowler).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Opening Bowler</label>
                <select 
                  value={bowler} 
                  onChange={(e) => setBowler(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                >
                  <option value={bowler}>{bowler}</option>
                  {bowlingSquad.filter(p => p !== striker && p !== nonStriker && p !== bowler).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Live Stream Option */}
        {(teamA && teamB) && (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Stream Option</h2>
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Absolutely Free</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setLiveStreamOption('mobile')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${liveStreamOption === 'mobile' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  <Camera className="w-4 h-4 mx-auto mb-1" />
                  Mobile Camera
                </button>
                <button 
                  onClick={() => setLiveStreamOption('professional')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${liveStreamOption === 'professional' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  <Video className="w-4 h-4 mx-auto mb-1" />
                  Pro Cameras
                </button>
                <button 
                  onClick={() => setLiveStreamOption('none')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${liveStreamOption === 'none' ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  <EyeOff className="w-4 h-4 mx-auto mb-1" />
                  No Stream
                </button>
              </div>
            </div>

            {liveStreamOption === "professional" && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">YouTube Stream URL (Optional)</label>
              <input 
                type="text" 
                value={youtubeUrl} 
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/live/..."
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
              />
            </div>
            )}
            
            <button 
              onClick={async () => {
                if (!user) {
                  alert("You must be logged in to create and save a match online.");
                  return;
                }

                if (user) {
                  const ongoingMatches = await dbService.getAll('matches', { owner_id: user.uid, status: 'Ongoing' });
                  if (ongoingMatches.length > 0) {
                    alert("An ongoing match already exists. Please complete it first.");
                    return;
                  }
                }
                localStorage.removeItem('livescoring_state');
                localStorage.setItem('activeSport', sportType);
                localStorage.setItem('match_live_stream_option', liveStreamOption);
                localStorage.setItem('match_team_a', teamA || 'Team A');
                localStorage.setItem('match_team_b', teamB || 'Team B');
                localStorage.setItem('match_overs', overs);
                localStorage.setItem('match_format', matchFormat);
                localStorage.setItem('match_location', location || 'Unknown Ground');
                localStorage.setItem('match_toss_winner', tossWinner === 'A' ? (teamA || 'Team A') : (teamB || 'Team B'));
                localStorage.setItem('match_toss_choice', tossChoice);
                localStorage.setItem('match_striker', striker);
                localStorage.setItem('match_non_striker', nonStriker);
                localStorage.setItem('match_next_batsman', nextBatsman);
                localStorage.setItem('match_bowler', bowler);
                localStorage.setItem('match_team_a_squad', JSON.stringify(teamAPlaying11));
                localStorage.setItem('match_team_b_squad', JSON.stringify(teamBPlaying11));

                localStorage.removeItem('prefill_team_a');
                localStorage.removeItem('prefill_team_b');
                localStorage.removeItem('prefill_sport_type');

                const docId = String(Date.now());
                localStorage.setItem('active_match_id', docId);
                
                if (user) {
                  try {
                    const matchData = {
                      teamA: teamA || 'Team A',
                      teamB: teamB || 'Team B',
                      overs,
                      matchFormat,
                      location: location || 'Unknown Ground',
                      tossWinner: tossWinner === 'A' ? (teamA || 'Team A') : (teamB || 'Team B'),
                      tossChoice,
                      sport_type: sportType,
                      matchTime: matchTime || null,
                      liveStream: liveStreamOption,
                      ownerId: user.uid,
                      status: 'Ongoing',
                      youtubeUrl,
                      liveStreamOption,
                      teamAPlaying11,
                      teamBPlaying11,
                      createdAt: Date.now()
                    };
                    
                    await dbService.create('matches', {
                      id: docId,
                      team_a: matchData.teamA,
                      team_b: matchData.teamB,
                      teamA: matchData.teamA,
                      teamB: matchData.teamB,
                      tossWinner: matchData.tossWinner,
                      tossChoice: matchData.tossChoice,
                      overs: 0,
                      overs_bowled: 0,
                      matchMaxOvers: matchData.overs || 20,
                      max_overs: matchData.overs || 20,
                      runs: 0,
                      wickets: 0,
                      balls: 0,
                      matchFormat: matchData.matchFormat,
                      location: matchData.location,
                      owner_id: matchData.ownerId,
                      ownerId: matchData.ownerId,
                      created_by: user?.uid || '',
                      status: matchData.status,
                      sport_type: sportType,
                      sportType: sportType,
                      youtubeUrl: matchData.youtubeUrl,
                      liveStreamOption: matchData.liveStreamOption,
                      teamAPlaying11: teamAPlaying11 || [],
                      teamBPlaying11: teamBPlaying11 || [],
                      striker: striker || '',
                      nonStriker: nonStriker || '',
                      bowler: bowler || '',
                      strikerStats: { runs: 0, balls: 0, fours: 0, sixes: 0 },
                      nonStrikerStats: { runs: 0, balls: 0, fours: 0, sixes: 0 },
                      bowlerStats: { wickets: 0, runs: 0, balls: 0 },
                      thisOver: [],
                      deliveries: [],
                      created_at: new Date().toISOString()
                    });
                  } catch(e: any) { 
                    console.warn('Firestore match save error', e); 
                    alert("Could not save match online: " + (e?.message || 'Unknown error') + ". Running in local mode.");
                  }
                }
                
                setFullScreenView('Match Scoring');
              }}
              className="w-full py-4 bg-[#d11a2a] hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 transition-all active:scale-95"
            >
              Start Match & Live Score
            </button>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Select Team {selectingFor}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search existing teams..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-[#d11a2a] animate-spin" />
                </div>
              ) : filteredTeams.length > 0 ? (
                <div className="space-y-1">
                  {filteredTeams.map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => handleSelect(t.name)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 flex items-center space-x-3 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.city || 'Local Team'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">No teams found</p>
                  <p className="text-xs text-slate-500 mb-4">"{searchQuery}" doesn't exist yet.</p>
                  
                  {searchQuery && (
                    <button 
                      onClick={() => handleSelect(searchQuery, true)}
                      className="inline-flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create "{searchQuery}"</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Squad Configuration Modal */}
      {squadModalTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {squadModalTeam === 'A' ? teamA : teamB} Playing 11
              </h2>
              <button onClick={() => setSquadModalTeam(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(squadModalTeam === 'A' ? teamAPlaying11 : teamBPlaying11).map((player, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="w-20 text-[10px] font-bold text-slate-400 uppercase">{idx < teamSize ? `Player ${idx + 1}` : sportType === 'Cricket' ? (idx === teamSize ? '12th Man' : `Extra ${idx - teamSize + 1}`) : `Sub ${idx - teamSize + 1}`}</span>
                  <input 
                    type="text"
                    value={player}
                    onChange={(e) => handleSquadPlayerChange(idx, e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                  />
                  <button 
                    onClick={() => setSearchPlayerModal({ index: idx, open: true, query: '', results: [], searching: false })}
                    className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-[#d11a2a] hover:bg-red-50 transition-colors"
                    title="Search Player by Mobile"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={() => setSquadModalTeam(null)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Player Modal */}
      {searchPlayerModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-md font-bold text-slate-800">Find Player</h2>
              <button onClick={() => setSearchPlayerModal({ index: -1, open: false, query: '', results: [], searching: false })} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number</label>
                <div className="flex space-x-2">
                  
                  <CountryCodeSelect value={searchPlayerCountryCode} onChange={setSearchPlayerCountryCode} className="w-1/3 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#d11a2a]" />
                  <input
                    type="text"
                    placeholder="99999 99999"
                    value={searchPlayerModal.query}
                    onChange={(e) => setSearchPlayerModal(prev => ({...prev, query: e.target.value}))}
                    className="w-2/3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                  />

                  <button 
                    onClick={handleSearchPlayer}
                    disabled={searchPlayerModal.searching}
                    className="bg-[#d11a2a] text-white px-3 py-2 rounded-lg"
                  >
                    {searchPlayerModal.searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {searchPlayerModal.results.length > 0 && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <h3 className="text-xs font-bold text-slate-500">Results:</h3>
                  {searchPlayerModal.results.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{p.full_name || p.username || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{p.phone}</div>
                      </div>
                      <button onClick={() => selectPlayer(p.full_name || p.username || 'Unknown')} className="text-xs bg-slate-200 px-3 py-1.5 rounded-full font-bold text-slate-700 hover:bg-slate-300">Select</button>
                    </div>
                  ))}
                </div>
              )}
              {searchPlayerModal.results.length === 0 && !searchPlayerModal.searching && searchPlayerModal.query && (
                <div className="text-center py-4 text-xs text-slate-500">No user found with this number.</div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Match Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Match Settings</h2>
              <button onClick={() => setSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Match Basics */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Match Basics</h3>
                {sportType === 'Cricket' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Match Format</label>
                      <select
                        value={matchFormat}
                        onChange={(e) => {
                          setMatchFormat(e.target.value);
                          if (e.target.value === 'ODI') setOvers('50');
                          else if (e.target.value === 'T20') setOvers('20');
                          else if (e.target.value === 'T10') setOvers('10');
                          else if (e.target.value === 'Test Match') setOvers('90');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                      >
                        <option value="T20">T20</option>
                        <option value="ODI">ODI</option>
                        <option value="T10">T10</option>
                        <option value="Test Match">Test Match</option>
                        <option value="Custom">Custom Overs</option>
                      </select>
                    </div>
                    {matchFormat === 'Custom' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Custom Overs</label>
                        <input 
                          type="number" 
                          value={overs} 
                          onChange={(e) => setOvers(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                        />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location/Ground</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lords Cricket Ground"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>

              
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Match Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={matchTime} 
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
                <div className="pt-2 border-t mt-4">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Live Streaming</label>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setLiveStreamOption('none')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border ${liveStreamOption === 'none' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      None
                    </button>
                    <button 
                      onClick={() => setLiveStreamOption('mobile')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border ${liveStreamOption === 'mobile' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      Mobile
                    </button>
                    <button 
                      onClick={() => setLiveStreamOption('professional')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border ${liveStreamOption === 'professional' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      Professional
                    </button>
                  </div>
                </div>

              {/* Toss */}
              {(teamA && teamB && sportType === 'Cricket') && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Toss</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Who won the toss?</label>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setTossWinner('A')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tossWinner === 'A' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {teamA}
                      </button>
                      <button 
                        onClick={() => setTossWinner('B')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tossWinner === 'B' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {teamB}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Opted to?</label>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setTossChoice('Bat')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tossChoice === 'Bat' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        Bat
                      </button>
                      <button 
                        onClick={() => setTossChoice('Bowl')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tossChoice === 'Bowl' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        Bowl
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Officials */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Match Officials</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Umpire 1</label>
                  <input 
                    type="text" 
                    value={umpires[0]} 
                    onChange={(e) => setUmpires([e.target.value, umpires[1]])}
                    placeholder="Enter umpire name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Umpire 2</label>
                  <input 
                    type="text" 
                    value={umpires[1]} 
                    onChange={(e) => setUmpires([umpires[0], e.target.value])}
                    placeholder="Enter umpire name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Scorer</label>
                  <input 
                    type="text" 
                    value={scorer} 
                    onChange={(e) => setScorer(e.target.value)}
                    placeholder="Enter scorer name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Match Referee</label>
                  <input 
                    type="text" 
                    value={referee} 
                    onChange={(e) => setReferee(e.target.value)}
                    placeholder="Enter referee name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={() => setSettingsModalOpen(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartMatch;
