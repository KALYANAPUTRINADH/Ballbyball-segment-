const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `                  <div className="flex space-x-3">
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading OBS Plugin for Windows...'); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-xs font-bold text-center transition-colors shadow-sm">
                      Download for Windows (.exe)
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading OBS Plugin for macOS...'); }} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 px-3 rounded text-xs font-bold text-center transition-colors shadow-sm">
                      Download for macOS (.pkg)
                    </a>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">Version 1.2.0 • Requires OBS Studio 28.0+</p>`;

const replacementStr = `                  <div className="flex space-x-3 mb-4">
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading OBS Plugin for Windows...'); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-xs font-bold text-center transition-colors shadow-sm">
                      Download for Windows (.exe)
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading OBS Plugin for macOS...'); }} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 px-3 rounded text-xs font-bold text-center transition-colors shadow-sm">
                      Download for macOS (.pkg)
                    </a>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <h5 className="text-xs font-bold text-indigo-800 mb-1 flex items-center"><Play className="w-3 h-3 mr-1" /> Smart Start</h5>
                    <p className="text-[10px] text-indigo-600 mb-2">Automate OBS stream start and local scoring recording via plugin integration.</p>
                    <button onClick={() => { alert('Smart Start triggered: Connecting to OBS plugin and initializing live score recording...'); }} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded text-xs font-bold transition-colors shadow-sm flex justify-center items-center">
                      <Sparkles className="w-3 h-3 mr-2" />
                      Initialize Smart Start
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">Version 1.2.0 • Requires OBS Studio 28.0+</p>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('./src/components/LiveScoring.tsx', code);
  console.log("Success");
} else {
  console.log("Target string not found");
}
