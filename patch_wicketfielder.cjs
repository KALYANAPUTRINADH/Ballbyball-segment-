const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `              {(wicketType === 'Caught' || wicketType === 'Run Out' || wicketType === 'Stumped') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Fielder (Optional)</label>
                  <input type="text" value={wicketFielder} onChange={(e) => setWicketFielder(e.target.value)} placeholder="Fielder Name" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]" />
                </div>
              )}`;

const newCode = `              {(wicketType === 'Caught' || wicketType === 'Run Out' || wicketType === 'Stumped') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Fielder (Optional)</label>
                  <select 
                    value={wicketFielder} 
                    onChange={(e) => setWicketFielder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#d11a2a]"
                  >
                    <option value="">Select Fielder (Optional)</option>
                    {bowlingSquad.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
