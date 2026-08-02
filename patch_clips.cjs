const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

const targetJSX = `            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {matchData?.clips?.map((clip: any) => (`;

const replacementJSX = `            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {matchData?.clips && matchData.clips.length > 1 && (
                <div className="bg-gradient-to-r from-red-900/40 to-slate-900/40 border border-red-900/50 rounded-xl p-3 mb-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs flex items-center"><Film className="w-3 h-3 mr-1 text-[#d11a2a]" /> Highlights Reel</span>
                    <span className="text-slate-400 text-[9px]">Compile {matchData.clips.length} clips</span>
                  </div>
                  <button 
                    onClick={handleGenerateAndShareHighlights}
                    disabled={generatingHighlights}
                    className="px-3 py-1.5 bg-[#d11a2a] hover:bg-red-700 disabled:bg-red-900/50 text-white rounded font-bold text-[10px] flex items-center space-x-1 transition-all"
                  >
                    {generatingHighlights ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
                    <span>{generatingHighlights ? 'Processing...' : 'Share'}</span>
                  </button>
                </div>
              )}
              
              {matchData?.clips?.map((clip: any) => (`;

code = code.replace(targetJSX, replacementJSX);
fs.writeFileSync('src/components/MatchStreamer.tsx', code);
