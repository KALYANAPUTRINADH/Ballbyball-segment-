const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">New Batsman</label>
                <div 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] cursor-pointer flex justify-between items-center"
                  onClick={() => setShowPlayerSearchModal(true)}
                >
                  <span className={newBatsmanName ? 'text-slate-900' : 'text-slate-400'}>
                    {newBatsmanName || 'Search player...'}
                  </span>
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
              </div>`;

const newCode = `              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">New Batsman</label>
                <select 
                  value={newBatsmanName} 
                  onChange={(e) => setNewBatsmanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#d11a2a]"
                >
                  <option value="">Select Batsman...</option>
                  {battingSquad.filter(p => p !== striker && p !== nonStriker).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
