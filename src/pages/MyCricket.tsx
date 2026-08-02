import { SportIcon } from '../components/SportIcon';
import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { ProBadge } from '../components/ProBadge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastContext';
import { Tournaments } from '../components/Tournaments';
import { Teams } from '../components/Teams';
import { Players } from '../components/Players';
import { AIAnalytics } from '../components/AIAnalytics';
import VideoSegmentation from './VideoSegmentation';
import { PlayerDashboard } from '../components/PlayerDashboard';
import { TeamChat } from '../components/TeamChat';
import { dbService } from '../lib/database';
import { ShareButton } from '../components/ShareButton';


const MyCricket = ({ setFullScreenView }: { setFullScreenView: (v: string) => void }) => {
  const { user, userMatches, userPreferences, isPro, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('Matches');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSport, setActiveSport] = useState(localStorage.getItem('activeSport') || 'All');
  useEffect(() => { localStorage.setItem('activeSport', activeSport); }, [activeSport]);
  const sports = ['All', 'Cricket', 'Football', 'Basketball', 'Tennis', 'Pickleball', 'Hockey', 'Volleyball', 'Badminton', 'Table Tennis'];


  const tabs = ['Matches', 'Tournaments', 'Teams', 'Stats', 'Performance', 'Chat', 'Highlights'];
  const filters = ['Your', 'Played', 'Network', 'All'];
  
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {

    setLoadingMatches(true);
    
    // Subscribe to all matches in real-time to auto-sync the scoreboard instantly!
    const unsubscribe = dbService.subscribe('matches', {}, (data) => {
      // Sort descending by created_at or updated_at or id
      const sorted = [...data].sort((a, b) => {
        const timeA = a.created_at || a.updated_at || a.id || '';
        const timeB = b.created_at || b.updated_at || b.id || '';
        return String(timeB).localeCompare(String(timeA));
      });
      setMatches(sorted);
      setLoadingMatches(false);
    });

    return () => unsubscribe();
  }, []);

  
    
  const handleDeleteMatch = async (e: React.MouseEvent, matchOrId: any) => {
    e.stopPropagation();
    const matchId = typeof matchOrId === 'string' ? matchOrId : matchOrId?.id;
    const matchObj = typeof matchOrId === 'object' ? matchOrId : matches.find(m => m.id === matchId);

    if (!user) {
      showToast("Please sign in to delete your match.", "error");
      return;
    }

    if (matchObj) {
      const isOwner = matchObj.owner_id === user.uid || matchObj.ownerId === user.uid || matchObj.created_by === user.uid || isAdmin;
      if (!isOwner) {
        showToast("Only the person who started this match can delete it.", "error");
        return;
      }
    }

    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        // Optimistically remove from state
        setMatches(prev => prev.filter(m => m.id !== matchId));
        
        if (localStorage.getItem('active_match_id') === matchId) {
          localStorage.removeItem('active_match_id');
        }

        // Remove from database collections
        await dbService.remove('matches', matchId);
        await dbService.remove('live_matches', matchId).catch(() => {});
        await dbService.remove('ball_by_ball', matchId).catch(() => {});

        showToast("Match deleted successfully!");
      } catch (err) {
        console.warn("Error deleting match", err);
        showToast("Failed to delete match.", "error");
      }
    }
  };

  const handleTabClick = (tab: string) => {
    const proTabs = ['Stats', 'Performance'];
    if (proTabs.includes(tab) && !isPro && !isAdmin) {
      if (setFullScreenView) {
         setFullScreenView(tab); // This will trigger the modal in App.tsx
      }
      return;
    }
    setActiveTab(tab);
  };

  

  const filteredMatches = matches.filter(m => {
    // 1. Sport filter
    const matchesSport = activeSport === 'All' ? true : (m.sport_type || 'Cricket') === activeSport;
    if (!matchesSport) return false;

    // 2. Tab category filter
    if (activeFilter === 'Your') {
      return m.owner_id === user?.uid || m.created_by === user?.uid;
    } else if (activeFilter === 'Played' || activeFilter === 'Network') {
      return m.owner_id !== user?.uid && m.created_by !== user?.uid;
    }
    return true; // 'All'
  });



  return (
    <div className="flex flex-col h-full bg-gray-100 pb-16 md:pb-6">
      {/* Top Tabs */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-100 p-2 space-x-2 bg-slate-50">
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
        <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-100">
          {tabs.map((tab) => {
            const isProTab = ['Stats', 'Performance'].includes(tab);
            return (
            <button 
              key={tab} 
              onClick={() => handleTabClick(tab)}
              className={`flex items-center justify-center space-x-1.5 flex-1 py-3 px-4 text-sm font-semibold shrink-0 transition-colors ${
                activeTab === tab ? 'text-[#d11a2a] border-b-2 border-[#d11a2a]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {isProTab && <ProBadge />}
              <span>{tab}</span>
            </button>
            );
          })}
        </div>
        
        <div className="px-4 py-3 bg-teal-50/50 flex items-center justify-between border-b border-gray-100">
          <span className="text-[15px] font-semibold text-gray-800">Want to start a match?</span>
          <button className="bg-teal-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-teal-700 transition-colors" onClick={() => {
            if (!user) {
              alert('Please sign in to start a match');
              return;
            }
            setFullScreenView('Start A Match');
          }}>
            Start
          </button>
        </div>

        <div className="px-4 py-3 flex space-x-3 overflow-x-auto hide-scrollbar shadow-sm">
          {filters.map((filter) => (
             <button 
               key={filter}
               onClick={() => setActiveFilter(filter)}
               className={`px-5 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-colors ${
                 activeFilter === filter ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
               }`}
             >
               {filter}
             </button>
          ))}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {activeTab === 'Matches' ? (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.length > 0 ? filteredMatches.map(match => (
              <div key={match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    localStorage.setItem('active_match_id', match.id);
                    localStorage.setItem('match_team_a', match.teamA || match.team_a || '');
                    localStorage.setItem('match_team_b', match.teamB || match.team_b || '');
                    localStorage.setItem('match_overs', match.overs || '');
                    localStorage.setItem('match_location', match.location || '');
                    localStorage.setItem('match_toss_winner', match.tossWinner || match.toss_winner || '');
                    localStorage.setItem('match_toss_choice', match.tossChoice || match.toss_choice || '');
                    setFullScreenView('Match Scoring');
                  }}>
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate mr-2">{match.location || 'Local Ground'}</span>
                  <div className="flex items-center space-x-1">
                     <ShareButton 
                        title={`Match: ${match.teamA || 'Team A'} vs ${match.teamB || 'Team B'}`}
                        text="Check out the match stats!"
                        url={`${window.location.origin}/match/${match.id}`}
                        className="p-1 bg-white/10"
                     />
                    {match.status === 'Completed' ? (
                      <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                        <span>COMPLETED</span>
                      </span>
                    ) : (
                      <span className="bg-[#d11a2a] text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 animate-pulse">
                        <span>LIVE</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-2 text-[11px] text-gray-400 border-b border-gray-50 flex items-center justify-between">
                  <span>{(match.sportType || match.sport_type) !== 'Cricket' ? (match.sportType || match.sport_type || 'Match') : `${match.overs || 0} Overs Match`}</span>
                  {match.youtubeUrl && <span className="ml-2 text-[#d11a2a] text-xs font-bold border border-red-200 px-1 rounded">YT Stream</span>}
                </div>
                <div className="p-3">
                  <div className="space-y-2 mb-4">
                    {(match.sportType || match.sport_type) !== 'Cricket' && (match.sportType || match.sport_type) ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">{match.teamA || match.team_a || 'Team A'}</span>
                          <span className="text-lg font-black text-slate-800">{match.scoreA || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">{match.teamB || match.team_b || 'Team B'}</span>
                          <span className="text-lg font-black text-slate-800">{match.scoreB || 0}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">{match.teamA || match.team_a || 'Team A'}</span>
                          <span className="text-sm font-semibold text-gray-500">{match.runs || 0}/{match.wickets || 0} <span className="text-xs font-normal">({match.overs_bowled || 0}.{match.balls || 0} Ov)</span></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">{match.teamB || match.team_b || 'Team B'}</span>
                          <span className="text-sm font-semibold text-gray-500">Yet to bat</span>
                        </div>
                      </>
                    )}
                  </div>
                  {(!match.sportType || match.sportType === 'Cricket' || match.sport_type === 'Cricket') && (
                    <>
                      {(match.striker || match.bowler) && (
                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-600 mb-2 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <span className="truncate flex-1">Batter: {match.striker || 'N/A'}</span>
                          <span className="truncate flex-1 text-right">Bowler: {match.bowler || 'N/A'}</span>
                        </div>
                      )}
                      <div className="text-xs font-medium text-amber-600 mb-2">
                        {(match.tossWinner || match.toss_winner || 'Unknown')} chose to {match.tossChoice || match.toss_choice || 'play'}
                      </div>
                    </>
                  )}
                  <div className="flex justify-end space-x-4 border-t border-gray-100 pt-3">
                    <button className="text-teal-600 text-xs font-semibold hover:text-teal-800" onClick={(e) => { e.stopPropagation(); setFullScreenView('My Performance'); }}>Insights</button>
                    
                    <button className="text-teal-600 text-xs font-semibold hover:text-teal-800" onClick={(e) => { e.stopPropagation(); setFullScreenView('Leaderboards'); }}>Leaderboard</button>
                    {user && (match.owner_id === user.uid || match.ownerId === user.uid || match.created_by === user.uid || isAdmin) && (
                      <button 
                        className="text-red-600 hover:text-red-800 text-xs font-bold ml-auto px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors shadow-xs" 
                        onClick={(e) => handleDeleteMatch(e, match)}
                        title="Delete Match"
                      >
                        Delete
                      </button>
                    )}

                  </div>
                </div>
                  {match.awards && (
                    <div className="bg-slate-50 p-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                      {match.awards.matchResult && (
                        <div className="flex flex-col col-span-2 bg-indigo-50 p-2 rounded border border-indigo-100">
                          <span className="text-indigo-400 font-semibold text-[10px] uppercase">Match Result</span>
                          <span className="font-bold text-indigo-800">{match.awards.matchResult}</span>
                        </div>
                      )}
                      {match.awards.motm && (
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase">MVP / MOTM</span>
                          <span className="font-bold text-gray-800">{match.awards.motm}</span>
                        </div>
                      )}
                      {match.awards.mvpPoints && (
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase">MVP Points</span>
                          <span className="font-bold text-yellow-600">+{match.awards.mvpPoints}</span>
                        </div>
                      )}
                      {match.awards.bestBatsman && (
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase">Best Batsman</span>
                          <span className="font-bold text-gray-800">{match.awards.bestBatsman}</span>
                        </div>
                      )}
                      {match.awards.bestBowler && (
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase">Best Bowler</span>
                          <span className="font-bold text-gray-800">{match.awards.bestBowler}</span>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )) : (
              <div className="col-span-full py-10 text-center text-gray-500">
                No matches found. Start a match to see it here!
              </div>
            )}
          </div>

        ) : (
          <>
          {activeTab === 'Tournaments' && <Tournaments activeSport={activeSport} setFullScreenView={setFullScreenView} />}
          {activeTab === 'Teams' && <Teams activeSport={activeSport} />}
          {activeTab === 'Stats' && <Players activeSport={activeSport} />}
          {activeTab === 'Performance' && <PlayerDashboard activeSport={activeSport} />}
          {activeTab === 'Chat' && <div className="p-2"><TeamChat /></div>}
          {activeTab === 'Highlights' && <div className="bg-white rounded-lg p-2"><VideoSegmentation /></div>}
          </>
        )}
      </div>
    </div>
  );
};

export default MyCricket;
