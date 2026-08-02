const fs = require('fs');

let code = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const regex = /\{\/\* All Matches.*?No live matches at the moment\.\n                  <\/div>\n                \)\}\n              <\/div>/s;

const replacement = `{/* Matches near Location & All Matches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center">Matches near <button onClick={() => setShowLocationModal(true)} className="ml-1 text-[#d11a2a] hover:underline flex items-center">{location} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="m6 9 6 6 6-6"/></svg></button></h2>
                <button className="text-teal-600 text-sm font-semibold hover:text-teal-800 transition-colors" onClick={() => showToast('Showing all matches...')}>View All</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {allMatches.filter(m => (activeSport === 'All' ? true : (m.sport_type || 'Cricket') === activeSport) && (m.location && m.location.toLowerCase().includes(location.toLowerCase()))).map(match => (
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
                        <span className="text-xs text-gray-500 truncate">{(match.sportType || match.sport_type) !== 'Cricket' ? (match.sportType || match.sport_type || 'Match') : \`Match • \${match.overs} Overs\`}</span>
                        <span className="bg-[#d11a2a] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Live</span>
                      </div>
                      <div className="space-y-2 mb-4 mt-3">
                        {(match.sportType || match.sport_type) !== 'Cricket' && (match.sportType || match.sport_type) ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamA}</span>
                              <span className="text-lg font-black text-slate-800">{match.scoreA || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamB}</span>
                              <span className="text-lg font-black text-slate-800">{match.scoreB || 0}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamA}</span>
                              <span className="text-sm font-semibold text-gray-900">{match.runs || 0}/{match.wickets || 0} <span className="text-xs font-normal text-gray-500">({match.overs_bowled || 0}.{match.balls || 0} Ov)</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamB}</span>
                              <span className="text-sm font-semibold text-gray-500">Yet to bat</span>
                            </div>
                          </>
                        )}
                      </div>
                      {(!match.sportType || match.sportType === 'Cricket' || match.sport_type === 'Cricket') && (
                        <div className="text-xs font-medium text-amber-600 mb-2">
                          {match.tossWinner} chose to {match.tossChoice}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {allMatches.filter(m => (activeSport === 'All' ? true : (m.sport_type || 'Cricket') === activeSport) && (m.location && m.location.toLowerCase().includes(location.toLowerCase()))).length === 0 && (
                  <div className="col-span-full py-4 text-center text-gray-500 text-sm bg-white rounded-lg border border-dashed border-gray-200">
                    No matches found near {location}.
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">All Live Matches</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMatches.filter(m => (activeSport === 'All' ? true : (m.sport_type || 'Cricket') === activeSport) && (!m.location || !m.location.toLowerCase().includes(location.toLowerCase()))).map(match => (
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
                        <span className="text-xs text-gray-500 truncate">{(match.sportType || match.sport_type) !== 'Cricket' ? (match.sportType || match.sport_type || 'Match') : \`Match • \${match.overs} Overs\`}</span>
                        <span className="bg-[#d11a2a] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Live</span>
                      </div>
                      <div className="space-y-2 mb-4 mt-3">
                        {(match.sportType || match.sport_type) !== 'Cricket' && (match.sportType || match.sport_type) ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamA}</span>
                              <span className="text-lg font-black text-slate-800">{match.scoreA || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamB}</span>
                              <span className="text-lg font-black text-slate-800">{match.scoreB || 0}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamA}</span>
                              <span className="text-sm font-semibold text-gray-900">{match.runs || 0}/{match.wickets || 0} <span className="text-xs font-normal text-gray-500">({match.overs_bowled || 0}.{match.balls || 0} Ov)</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{match.teamB}</span>
                              <span className="text-sm font-semibold text-gray-500">Yet to bat</span>
                            </div>
                          </>
                        )}
                      </div>
                      {(!match.sportType || match.sportType === 'Cricket' || match.sport_type === 'Cricket') && (
                        <div className="text-xs font-medium text-amber-600 mb-2">
                          {match.tossWinner} chose to {match.tossChoice}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {allMatches.filter(m => (activeSport === 'All' ? true : (m.sport_type || 'Cricket') === activeSport) && (!m.location || !m.location.toLowerCase().includes(location.toLowerCase()))).length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-500 text-sm bg-white rounded-lg border border-dashed border-gray-200">
                    No other live matches right now.
                  </div>
                )}
              </div>`;

if (regex.test(code)) {
  fs.writeFileSync('src/pages/Home.tsx', code.replace(regex, replacement));
  console.log("Patched Home.tsx successfully.");
} else {
  console.log("Failed to match regex in Home.tsx");
}
