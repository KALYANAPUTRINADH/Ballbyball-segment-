const fs = require('fs');
let code = fs.readFileSync('./src/components/MatchStreamer.tsx', 'utf-8');

const targetStr = `            {/* Scoreboard Widget */}
            <ScoreboardWidget `;

const newCode = `            {/* Umpire Signal Overlay */}
            {matchData.umpireSignal && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-8 z-50 animate-in zoom-in fade-in duration-300 pointer-events-none">
                <div className="bg-gradient-to-r from-amber-500 to-[#d11a2a] text-white px-10 py-6 rounded-3xl shadow-2xl text-center border-4 border-white/20">
                  <h2 className="text-6xl font-black uppercase tracking-widest drop-shadow-lg">{matchData.umpireSignal}</h2>
                </div>
              </div>
            )}

            {/* Scoreboard Widget */}
            <ScoreboardWidget `;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/MatchStreamer.tsx', code);
