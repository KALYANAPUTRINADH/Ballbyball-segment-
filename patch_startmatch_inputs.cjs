const fs = require('fs');
let code = fs.readFileSync('./src/pages/StartMatch.tsx', 'utf-8');

const targetStr = `        {/* Opening Players */}
        {(teamA && teamB && sportType === 'Cricket') && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Opening Players</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Striker (Batter)</label>
                <input 
                  type="text" 
                  value={striker} 
                  onChange={(e) => setStriker(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Non-Striker (Batter)</label>
                <input 
                  type="text" 
                  value={nonStriker} 
                  onChange={(e) => setNonStriker(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Opening Bowler</label>
                <input 
                  type="text" 
                  value={bowler} 
                  onChange={(e) => setBowler(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>
            </div>
          </div>
        )}`;

const newCode = `        {/* Opening Players */}
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
        })()}`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/pages/StartMatch.tsx', code);
