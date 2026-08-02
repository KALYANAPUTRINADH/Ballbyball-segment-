const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `                          <button 
                            disabled={isRainDelayed}
                            onClick={handleWicket} 
                            className={\`w-full h-14 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-xl font-bold transition-all active:scale-95 text-lg flex items-center justify-center \${isRainDelayed ? 'opacity-50 cursor-not-allowed' : ''}\`}
                          >
                            OUT
                          </button>
                        </div>`;

const newCode = targetStr + `
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-4 flex items-center"><Shield className="w-3 h-3 mr-1" /> Umpire Signals Overlay</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {['Four', 'Six', 'Wide', 'No Ball', 'Out'].map(signal => (
                              <button
                                key={signal}
                                onClick={() => {
                                  setUmpireSignal(signal);
                                  if (matchId && isOwner) {
                                      scoreboardService.updateScore(matchId, { umpireSignal: signal }, sportType);
                                      setTimeout(() => {
                                          setUmpireSignal(null);
                                          scoreboardService.updateScore(matchId, { umpireSignal: null }, sportType);
                                      }, 4000);
                                  } else {
                                      setTimeout(() => setUmpireSignal(null), 4000);
                                  }
                                }}
                                className="h-10 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-[10px] uppercase transition-all active:scale-95 border border-amber-200"
                              >
                                {signal}
                              </button>
                            ))}
                          </div>
                        </div>`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
