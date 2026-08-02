const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const motmRegex = /<label className="block text-sm font-medium text-slate-700 mb-1">Man of the Match \/ Best Player<\/label>\s*<input[^>]+value=\{awards\.motm\}[^>]+onChange=\{e => setAwards\(\{\.\.\.awards, motm: e\.target\.value\}\)\}[^>]+placeholder="e\.g\. Virat Kohli"\s*\/>/;

const bestBatRegex = /<label className="block text-sm font-medium text-slate-700 mb-1">Best Batsman<\/label>\s*<input[^>]+value=\{awards\.bestBatsman\}[^>]+onChange=\{e => setAwards\(\{\.\.\.awards, bestBatsman: e\.target\.value\}\)\}[^>]+placeholder="e\.g\. Rohit Sharma"\s*\/>/;

const bestBowlRegex = /<label className="block text-sm font-medium text-slate-700 mb-1">Best Bowler<\/label>\s*<input[^>]+value=\{awards\.bestBowler\}[^>]+onChange=\{e => setAwards\(\{\.\.\.awards, bestBowler: e\.target\.value\}\)\}[^>]+placeholder="e\.g\. Jasprit Bumrah"\s*\/>/;

const motmReplacement = \`<label className="block text-sm font-medium text-slate-700 mb-1">Man of the Match / Best Player</label>
                <select 
                  value={awards.motm}
                  onChange={e => setAwards({...awards, motm: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                >
                  <option value="">Select Player...</option>
                  {[...squadA, ...squadB].map(p => {
                    const stats = playerStats[p]?.[sportType];
                    const statStr = stats && sportType === 'Cricket' ? \\\` (Runs: \\\${stats.runs || 0}, Wickets: \\\${stats.wickets || 0})\\\` : '';
                    return <option key={p} value={p}>{p}{statStr}</option>;
                  })}
                </select>\`;

const bestBatReplacement = \`<label className="block text-sm font-medium text-slate-700 mb-1">Best Batsman</label>
                    <select 
                      value={awards.bestBatsman}
                      onChange={e => setAwards({...awards, bestBatsman: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    >
                      <option value="">Select Batsman...</option>
                      {[...squadA, ...squadB].map(p => {
                        const stats = playerStats[p]?.[sportType];
                        const statStr = stats && sportType === 'Cricket' ? \\\` (Runs: \\\${stats.runs || 0}, SR: \\\${stats.balls ? ((stats.runs/stats.balls)*100).toFixed(0) : 0})\\\` : '';
                        return <option key={p} value={p}>{p}{statStr}</option>;
                      })}
                    </select>\`;

const bestBowlReplacement = \`<label className="block text-sm font-medium text-slate-700 mb-1">Best Bowler</label>
                    <select 
                      value={awards.bestBowler}
                      onChange={e => setAwards({...awards, bestBowler: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    >
                      <option value="">Select Bowler...</option>
                      {[...squadA, ...squadB].map(p => {
                        const stats = playerStats[p]?.[sportType];
                        const statStr = stats && sportType === 'Cricket' ? \\\` (Wickets: \\\${stats.wickets || 0}, Eco: \\\${stats.balls ? ((stats.runsConceded||0)/(stats.balls/6)).toFixed(1) : 0})\\\` : '';
                        return <option key={p} value={p}>{p}{statStr}</option>;
                      })}
                    </select>\`;

code = code.replace(motmRegex, motmReplacement);
code = code.replace(bestBatRegex, bestBatReplacement);
code = code.replace(bestBowlRegex, bestBowlReplacement);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
