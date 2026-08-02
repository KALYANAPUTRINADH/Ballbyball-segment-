const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `            {/* Active Badge Celebration */}`;

const newCode = `            {/* Umpire Signal Overlay */}
            {umpireSignal && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-50 animate-in zoom-in fade-in duration-300 pointer-events-none">
                <div className="bg-gradient-to-r from-amber-500 to-[#d11a2a] text-white px-10 py-6 rounded-3xl shadow-2xl text-center border-4 border-white">
                  <h2 className="text-5xl font-black uppercase tracking-widest drop-shadow-lg">{umpireSignal}</h2>
                </div>
              </div>
            )}

            {/* Active Badge Celebration */}`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
