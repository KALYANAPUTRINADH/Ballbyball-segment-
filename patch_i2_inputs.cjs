const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const i2StrikerInput = `<input type="text" value={i2Striker} onChange={(e) => setI2Striker(e.target.value)} placeholder="Striker Name" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]" />`;

const i2StrikerSelect = `<select value={i2Striker} onChange={(e) => setI2Striker(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]">
  <option value="">Select Striker...</option>
  {bowlingSquad.filter(p => p !== i2NonStriker && p !== i2Bowler).map(p => <option key={p} value={p}>{p}</option>)}
</select>`;

const i2NonStrikerInput = `<input type="text" value={i2NonStriker} onChange={(e) => setI2NonStriker(e.target.value)} placeholder="Non-Striker Name" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]" />`;

const i2NonStrikerSelect = `<select value={i2NonStriker} onChange={(e) => setI2NonStriker(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]">
  <option value="">Select Non-Striker...</option>
  {bowlingSquad.filter(p => p !== i2Striker && p !== i2Bowler).map(p => <option key={p} value={p}>{p}</option>)}
</select>`;

const i2BowlerInput = `<input type="text" value={i2Bowler} onChange={(e) => setI2Bowler(e.target.value)} placeholder="Bowler Name" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]" />`;

const i2BowlerSelect = `<select value={i2Bowler} onChange={(e) => setI2Bowler(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]">
  <option value="">Select Bowler...</option>
  {battingSquad.filter(p => p !== i2Striker && p !== i2NonStriker).map(p => <option key={p} value={p}>{p}</option>)}
</select>`;

code = code.replace(i2StrikerInput, i2StrikerSelect);
code = code.replace(i2NonStrikerInput, i2NonStrikerSelect);
code = code.replace(i2BowlerInput, i2BowlerSelect);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
