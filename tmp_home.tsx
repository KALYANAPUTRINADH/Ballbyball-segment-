import { SportIcon } from '../components/SportIcon';
import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import { Plus, Search, Trophy, Shield, Users, User, ArrowRight, Play } from 'lucide-react';
import { PerformanceComparison } from '../components/PerformanceComparison';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';

const locations = [
  "Hyderabad",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
];

const Home = ({ setFullScreenView, openProModal }: { setFullScreenView?: (v: string | null) => void, openProModal?: () => void }) => {
  const { showToast } = useToast();
  const { user, userMatches, userPreferences, isPro, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('For you');
  const [activeSport, setActiveSport] = useState('All');
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<any[]>([]);
  
  const [location, setLocation] = useState("Hyderabad");
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const tData = (await dbService.getAll('tournaments')) || [];
        const cData = (await dbService.getAll('clubs')) || [];
        const aData = (await dbService.getAll('associations')) || [];
        const uData = (await dbService.getAll('profiles')) || [];
        const mData = (await dbService.getAll('matches')) || [];

        let combined = [
          ...tData.map((d: any) => ({ ...d, searchType: 'Tournament', name: d.name || 'Unnamed Tournament', icon: Trophy, color: 'indigo' })),
          ...cData.map((d: any) => ({ ...d, searchType: 'Club', name: d.name || 'Unnamed Club', icon: Shield, color: 'emerald' })),
          ...aData.map((d: any) => ({ ...d, searchType: 'Association', name: d.name || 'Unnamed Association', icon: Users, color: 'amber' })),
          ...uData.map((d: any) => ({ ...d, searchType: 'Athlete', name: d.displayName || d.username || d.name || 'Unknown Athlete', icon: User, color: 'slate' })),
          ...mData.map((d: any) => ({ ...d, searchType: 'Match', name: `${d.teamA || d.team_a || 'Team A'} vs ${d.teamB || d.team_b || 'Team B'}`, icon: Play, color: 'red' }))
        ];

        setSearchData(combined);
      } catch (e) {
        console.warn('Error fetching search data', e);
      }
    };
    fetchSearchData();
  }, []);

  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const query = globalSearch.toLowerCase().trim();
    const queryParts = query.split(/\s+/);
    
    // Standard substring search
    const results = searchData.filter(item => {
      const itemSport = item.sport || item.sport_type;
      if (activeSport !== 'All' && itemSport && itemSport !== 'All' && itemSport !== activeSport) return false;
      const text = (item.name + ' ' + (itemSport || '') + ' ' + (item.format || '') + ' ' + (item.location || '')).toLowerCase();
      
      return queryParts.every(part => text.includes(part));
    });
    
    setSearchResults(results);
    setIsSearching(false);
  }, [globalSearch, searchData, activeSport]);

  const sports = ['All', 'Cricket', 'Football', 'Basketball', 'Tennis', 'Pickleball', 'Hockey', 'Volleyball', 'Badminton', 'Table Tennis'];

  return (
    <div className="flex flex-col h-full bg-gray-100 pb-16 md:pb-6">
      {/* Top Tabs */}
      <div className="bg-white flex flex-col w-full border-b sticky top-0 z-10">
        <div className="flex w-full">
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'For you' ? 'text-[#d11a2a] border-b-2 border-[#d11a2a]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('For you')}
          >
            For you
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-1 transition-colors ${activeTab === 'PRO Club' ? 'text-[#d11a2a] border-b-2 border-[#d11a2a]' : 'text-teal-600 hover:text-teal-700'}`}
            onClick={() => setActiveTab('PRO Club')}
          >
            <span className="bg-teal-600 text-white text-[10px] px-1 rounded-sm">PRO</span>
            <span>Club</span>
          </button>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar p-2 space-x-2 bg-slate-50 border-t border-slate-100">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`flex items-center px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${
                activeSport === sport ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SportIcon sport={sport} className="w-3.5 h-3.5 mr-1" />
              <span>{sport}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'For you' || isPro || isAdmin ? (
          <>
            {activeTab === 'PRO Club' && (
              <div className="bg-teal-600 text-white p-4 rounded-xl shadow-lg mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Welcome to PRO Club
                </h2>
                <p className="text-teal-50 text-sm mt-1">You have access to exclusive tournaments, networking, and advanced analytics.</p>
              </div>
            )}
            {/* Global Search Bar */}
            <div className="relative">
              <div className="flex items-center bg-white border border-slate-300 rounded-full px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#d11a2a] focus-within:border-[#d11a2a] transition-all">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search tournaments, clubs, athletes..." 
                  className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-slate-700"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>
              
              {globalSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                  <div className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">Search Results for "{globalSearch}"</div>
                  
                  {/* Dynamic Search Results */}
                  <div className="divide-y divide-slate-100">
                    {searchResults.length > 0 ? (
                      searchResults.map((item: any, idx: number) => {
                        const IconComponent = item.icon || Trophy;
                        const iconColors: Record<string, string> = {
                          indigo: 'bg-indigo-100 text-indigo-600',
                          emerald: 'bg-emerald-100 text-emerald-600',
                          amber: 'bg-amber-100 text-amber-600',
                          slate: 'bg-slate-100 text-slate-600',
                          red: 'bg-red-100 text-red-600'
                        };
                        const colorClass = iconColors[item.color || 'slate'] || 'bg-slate-100 text-slate-600';
                        
                        return (
                          <div 
                            key={item.id || idx} 
                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between" 
                            onClick={() => { 
                              setGlobalSearch(''); 
                              if (setFullScreenView) {
                                if (item.searchType === 'Tournament') setFullScreenView('Tournament Hub');
                                else if (item.searchType === 'Club') setFullScreenView('Clubs');
                                else if (item.searchType === 'Association') setFullScreenView('Associations');
                                else if (item.searchType === 'Athlete') {
                                  window.dispatchEvent(new CustomEvent('openPlayerProfile', { detail: item }));
                                }
                                else if (item.searchType === 'Match') {
                                  localStorage.setItem('active_match_id', item.id);
                                  setFullScreenView('Match Scoring');
                                }
                              } else {
                                showToast(`${item.searchType} opened`);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{item.name}</div>
                                <div className="text-xs text-slate-500">{item.searchType} &bull; {item.sport || item.sport_type || 'General'}</div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No matches found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Chat bubble */}
            <div className="flex items-start space-x-4">
              <div className="relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullScreenView ? setFullScreenView('Profile') : showToast('Profile clicked')}>
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-teal-100 border border-teal-200">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-teal-700 font-bold text-lg">{user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full text-white p-0.5 border border-white">
                  <Plus size={12} />
                </div>
                <div className="text-center text-xs font-medium text-gray-700 mt-1">You</div>
              </div>
              
              <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => showToast('No new updates right now.')}>
                <p className="text-sm text-gray-600">
                  Follow your favourite cricketers to see their updates here.
                </p>
                <div className="absolute -left-2 top-0 w-4 h-4 bg-white border-l border-t border-gray-200 transform -rotate-45 -translate-y-1/2 translate-x-1/2 mt-3" />
              </div>
            </div>

            
            
            {/* Tournament Hub Banner */}
            <div 
              className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-slate-700"
              onClick={() => setFullScreenView ? setFullScreenView('Tournament Hub') : showToast('Tournament Hub opened')}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#d11a2a]/20 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Tournament Hub</h2>
                  <p className="text-slate-300 text-sm font-medium">Explore & join active tournaments</p>
                </div>
                <div className="bg-[#d11a2a] w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
              </div>
            </div>

            
            {/* Performance Comparison */}
            <PerformanceComparison sport={activeSport} />
            
            {/* Matches near <button onClick={() => setShowLocationModal(true)} className="ml-1 text-[#d11a2a] hover:underline flex items-center">{location} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="m6 9 6 6 6-6"/></svg></button> */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">Matches near <button onClick={() => setShowLocationModal(true)} className="ml-1 text-[#d11a2a] hover:underline flex items-center">{location} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="m6 9 6 6 6-6"/></svg></button></h2>
                <button className="text-teal-600 text-sm font-semibold hover:text-teal-800 transition-colors" onClick={() => showToast('Showing all matches...')}>View All</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(userMatches || []).filter(m => (activeSport === 'All' ? true : (m.sport_type || 'Cricket') === activeSport) && (!m.location || m.location.toLowerCase().includes(location.toLowerCase()))).map(match => (
                  <div key={match.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    localStorage.setItem('active_match_id', match.id);
                    localStorage.setItem('match_team_a', match.teamA || '');
                    localStorage.setItem('match_team_b', match.teamB || '');
                    localStorage.setItem('match_overs', match.overs || '');
                    localStorage.setItem('match_location', match.location || '');
                    localStorage.setItem('match_toss_winner', match.tossWinner || '');
                    localStorage.setItem('match_toss_choice', match.tossChoice || '');
                    if (setFullScreenView) setFullScreenView('Match Scoring');
                  }}>
                    <div className="bg-gray-100 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 truncate">{match.location || 'Local Ground'}</span>
                      <div className="flex space-x-2 text-gray-500">
                        {match.youtubeUrl && <span className="text-[#d11a2a] text-xs font-bold border border-red-200 px-1 rounded">YT</span>}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 truncate">Match • {match.overs} Overs</span>
                        <span className="bg-[#d11a2a] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Live</span>
                      </div>
                      <div className="space-y-2 mb-4 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamA}</span>
                          <span className="text-sm font-semibold text-gray-900">{match.runs || 0}/{match.wickets || 0} <span className="text-xs font-normal text-gray-500">({match.overs_bowled || 0}.{match.balls || 0} Ov)</span></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamB}</span>
                          <span className="text-sm font-semibold text-gray-500">Yet to bat</span>
                        </div>
                      </div>

                      <div className="text-xs font-medium text-amber-600 mb-2">
                        {match.tossWinner} chose to {match.tossChoice}
                      </div>
                    </div>
                  </div>
                ))}

                
                {(userMatches || []).length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-500 text-sm">
                    No live matches at the moment.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
             <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="text-teal-600 font-bold text-xl">PRO</span>
             </div>
             <h2 className="text-lg font-bold text-slate-800 mb-2">Upgrade to PRO</h2>
             <p className="text-slate-500 mb-6 max-w-xs mx-auto">Get access to professional streaming, advanced statistics, and more.</p>
             <button onClick={() => openProModal && openProModal()} className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-teal-700 transition-colors">
               Explore PRO Features
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Home;

