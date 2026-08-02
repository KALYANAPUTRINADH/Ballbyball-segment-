const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Man of the Match / Best Player</label>
                <input 
                  type="text" 
                  value={awards.motm}
                  onChange={e => setAwards({...awards, motm: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="e.g. Virat Kohli"
                />
              </div>
                
              {sportType === 'Cricket' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Best Batsman</label>
                    <input 
                      type="text" 
                      value={awards.bestBatsman}
                      onChange={e => setAwards({...awards, bestBatsman: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                      placeholder="e.g. Rohit Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Best Bowler</label>
                    <input 
                      type="text" 
                      value={awards.bestBowler}
                      onChange={e => setAwards({...awards, bestBowler: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                      placeholder="e.g. Jasprit Bumrah"
                    />
                  </div>`;

const newCode = `              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Man of the Match / Best Player</label>
                <select 
                  value={awards.motm}
                  onChange={e => setAwards({...awards, motm: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                >
                  <option value="">Select Player...</option>
                  {[...squadA, ...squadB].map(p => {
                    const stats = playerStats[p]?.['Cricket'];
                    const statStr = stats ? \` (Runs: \${stats.runs || 0}, Wickets: \${stats.wickets || 0})\` : '';
                    return <option key={p} value={p}>{p}{sportType === 'Cricket' ? statStr : ''}</option>;
                  })}
                </select>
              </div>
                
              {sportType === 'Cricket' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Best Batsman</label>
                    <select 
                      value={awards.bestBatsman}
                      onChange={e => setAwards({...awards, bestBatsman: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    >
                      <option value="">Select Batsman...</option>
                      {[...squadA, ...squadB].map(p => {
                        const stats = playerStats[p]?.['Cricket'];
                        const statStr = stats ? \` (Runs: \${stats.runs || 0}, SR: \${stats.balls ? ((stats.runs/stats.balls)*100).toFixed(0) : 0})\` : '';
                        return <option key={p} value={p}>{p}{statStr}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Best Bowler</label>
                    <select 
                      value={awards.bestBowler}
                      onChange={e => setAwards({...awards, bestBowler: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    >
                      <option value="">Select Bowler...</option>
                      {[...squadA, ...squadB].map(p => {
                        const stats = playerStats[p]?.['Cricket'];
                        const statStr = stats ? \` (Wickets: \${stats.wickets || 0}, Eco: \${stats.balls ? ((stats.runsConceded||0)/(stats.balls/6)).toFixed(1) : 0})\` : '';
                        return <option key={p} value={p}>{p}{statStr}</option>;
                      })}
                    </select>
                  </div>`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
