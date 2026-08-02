const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `                    <div className="flex space-x-2">
                      <button onClick={() => setShowTransferModal(true)} className="flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                        Transfer
                      </button>
                      <button onClick={handleUndo} className="flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                        <RotateCcw className="w-3 h-3 mr-1" /> Undo Last Ball
                      </button>
                      {sportType === 'Cricket' && (
                        <button onClick={() => setShowDlsModal(true)} className="flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                          <Calculator className="w-3 h-3 mr-1" /> DLS Calc
                        </button>
                      )}
                    </div>`;

const newCode = `                    <div className="flex space-x-2 flex-wrap items-center gap-y-2">
                      <button onClick={() => setShowTransferModal(true)} className="flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors mr-2">
                        Transfer
                      </button>
                      <button onClick={handleUndo} className="flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mr-2">
                        <RotateCcw className="w-3 h-3 mr-1" /> Undo Last Ball
                      </button>
                      {sportType === 'Cricket' && (
                        <button onClick={() => setShowDlsModal(true)} className="flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors mr-2">
                          <Calculator className="w-3 h-3 mr-1" /> DLS Calc
                        </button>
                      )}
                      {sportType === 'Cricket' && (
                        <select
                          value={scoreboardTheme}
                          onChange={(e) => {
                            setScoreboardTheme(e.target.value);
                            localStorage.setItem('scoreboard_theme', e.target.value);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#d11a2a]"
                        >
                          <option value="modern">Modern Theme</option>
                          <option value="classic">Classic Theme</option>
                          <option value="minimalist">Minimalist Theme</option>
                          <option value="ipl">IPL Theme</option>
                        </select>
                      )}
                    </div>`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
