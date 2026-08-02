const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `<select
                  value={subSelectedPlayer}
                  onChange={(e) => setSubSelectedPlayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                >
                  <option value="">Select a player from squad...</option>
                  {(() => {
                    const squadA = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('match_team_a_squad') || '[]' : '[]');
                    const squadB = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('match_team_b_squad') || '[]' : '[]');
                    const combined = [...squadA, ...squadB];
                    if (combined.length === 0) return <option value="" disabled>No players in squads</option>;
                    return combined.map(p => (p !== striker && p !== nonStriker && p !== bowler) ? <option key={p} value={p}>{p}</option> : null);
                  })()}
                </select>`;

const newCode = `<select
                  value={subSelectedPlayer}
                  onChange={(e) => setSubSelectedPlayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                >
                  <option value="">Select a player from squad...</option>
                  {(subActivePlayerRole === 'bowler' ? bowlingSquad : battingSquad).filter(p => p !== striker && p !== nonStriker && p !== bowler).map(p => <option key={p} value={p}>{p}</option>)}
                </select>`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
