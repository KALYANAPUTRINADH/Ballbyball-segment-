const fs = require('fs');
let code = fs.readFileSync('./src/pages/StartMatch.tsx', 'utf-8');

code = code.replace(
  "const [teamA, setTeamA] = useState<string | null>(() => localStorage.getItem('prefill_team_a') || null);\n  const [overs, setOvers] = useState('20');",
  "const [teamA, setTeamA] = useState<string | null>(() => localStorage.getItem('prefill_team_a') || null);\n  const [matchFormat, setMatchFormat] = useState('T20');\n  const [overs, setOvers] = useState('20');"
);

code = code.replace(
  "localStorage.setItem('match_overs', overs);",
  "localStorage.setItem('match_overs', overs);\n                localStorage.setItem('match_format', matchFormat);"
);

code = code.replace(
  "overs,\n                      location:",
  "overs,\n                      matchFormat,\n                      location:"
);

code = code.replace(
  "overs: matchData.overs,\n                        location:",
  "overs: matchData.overs,\n                        matchFormat: matchData.matchFormat,\n                        location:"
);

code = code.replace(
  `                {sportType === 'Cricket' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Overs</label>
                    <input 
                      type="number" 
                      value={overs} 
                      onChange={(e) => setOvers(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                    />
                  </div>
                )}`,
  `                {sportType === 'Cricket' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Match Format</label>
                      <select
                        value={matchFormat}
                        onChange={(e) => {
                          setMatchFormat(e.target.value);
                          if (e.target.value === 'ODI') setOvers('50');
                          else if (e.target.value === 'T20') setOvers('20');
                          else if (e.target.value === 'T10') setOvers('10');
                          else if (e.target.value === 'Test Match') setOvers('90');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                      >
                        <option value="T20">T20</option>
                        <option value="ODI">ODI</option>
                        <option value="T10">T10</option>
                        <option value="Test Match">Test Match</option>
                        <option value="Custom">Custom Overs</option>
                      </select>
                    </div>
                    {matchFormat === 'Custom' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Custom Overs</label>
                        <input 
                          type="number" 
                          value={overs} 
                          onChange={(e) => setOvers(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                        />
                      </div>
                    )}
                  </div>
                )}`
);

fs.writeFileSync('./src/pages/StartMatch.tsx', code);
