const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const regex = /<\/div>\s*<div>\s*<label className="block text-sm font-medium text-slate-700 mb-1">Man of the Match \/ Best Player<\/label>/;

const newCode = \`</div>
              
              {isTied && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center">
                  <h3 className="text-sm font-bold text-orange-800 mb-2">Match Tied!</h3>
                  {matchFormat === 'Test Match' ? (
                    <p className="text-xs text-orange-700 font-medium">Test matches end in a Draw when scores are level.</p>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setAwards({...awards, matchResult: 'Draw'});
                        }}
                        className={\\\`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors \\\${(awards as any).matchResult === 'Draw' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-700 border-orange-300 hover:bg-orange-100'}\\\`}
                      >
                        Declare Draw
                      </button>
                      <button
                        onClick={() => {
                          setInningsScores(prev => [...prev, { runs, wickets, overs, balls }]);
                          setInnings(innings + 1);
                          setRuns(0);
                          setWickets(0);
                          setOvers(0);
                          setBalls(0);
                          setThisOver([]);
                          setTarget(null);
                          setMatchMaxOvers(1);
                          setStriker('Player 1');
                          setNonStriker('Player 2');
                          setBowler('Player 11');
                          setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                          setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                          setBowlerStats({ runs: 0, wickets: 0, balls: 0 });
                          setHistory([]);
                          setShowAwardsModal(false);
                          if (matchId) {
                            scoreboardService.updateScore(matchId, {
                              innings: innings + 1,
                              runs: 0, wickets: 0, overs: 0, balls: 0, thisOver: [],
                              target: null, matchMaxOvers: 1,
                              striker: 'Player 1', nonStriker: 'Player 2', bowler: 'Player 11',
                              strikerStats: { runs: 0, balls: 0, fours: 0, sixes: 0 },
                              nonStrikerStats: { runs: 0, balls: 0, fours: 0, sixes: 0 },
                              bowlerStats: { runs: 0, wickets: 0, balls: 0 }
                            }, sportType);
                          }
                        }}
                        className="flex-1 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                      >
                        Play Super Over
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Man of the Match / Best Player</label>\`;

code = code.replace(regex, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
