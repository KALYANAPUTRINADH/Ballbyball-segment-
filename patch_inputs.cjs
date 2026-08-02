const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const strikerInput = `<input 
                            type="text" 
                            value={striker} 
                            onChange={(e) => setStriker(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                          />`;

const strikerSelect = `<select 
                            value={striker} 
                            onChange={(e) => setStriker(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                          >
                            <option value={striker}>{striker}</option>
                            {battingSquad.filter((p) => p !== striker && p !== nonStriker && p !== bowler).map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>`;

const nonStrikerInput = `<input 
                              type="text" 
                              value={nonStriker} 
                              onChange={(e) => setNonStriker(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                            />`;

const nonStrikerSelect = `<select 
                              value={nonStriker} 
                              onChange={(e) => setNonStriker(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                            >
                              <option value={nonStriker}>{nonStriker}</option>
                              {battingSquad.filter((p) => p !== striker && p !== nonStriker && p !== bowler).map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>`;

const bowlerInput = `<input 
                              type="text" 
                              value={bowler} 
                              onChange={(e) => setBowler(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                            />`;

const bowlerSelect = `<select 
                              value={bowler} 
                              onChange={(e) => setBowler(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                            >
                              <option value={bowler}>{bowler}</option>
                              {bowlingSquad.filter((p) => p !== striker && p !== nonStriker && p !== bowler).map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>`;

code = code.replace(strikerInput, strikerSelect);
code = code.replace(nonStrikerInput, nonStrikerSelect);
code = code.replace(bowlerInput, bowlerSelect);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
