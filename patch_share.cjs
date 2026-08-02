const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

// 1. Add missing imports
code = code.replace(
  "Activity, Check, AlertCircle, Terminal, Sliders, Tv, Cast, Link, Link2, RefreshCw, Download",
  "Activity, Check, AlertCircle, Terminal, Sliders, Tv, Cast, Link, Link2, RefreshCw, Download, Film, Loader2"
);

// 2. Add state
code = code.replace(
  "const [showShareModal, setShowShareModal] = useState(false);",
  "const [showShareModal, setShowShareModal] = useState(false);\n  const [generatingHighlights, setGeneratingHighlights] = useState(false);"
);

// 3. Add handle function (anywhere after state)
code = code.replace(
  "const [showClipsDrawer, setShowClipsDrawer] = useState(false);",
  "const [showClipsDrawer, setShowClipsDrawer] = useState(false);\n\n  const handleGenerateAndShareHighlights = () => {\n    setGeneratingHighlights(true);\n    setTimeout(() => {\n      setGeneratingHighlights(false);\n      const url = `${window.location.origin}/highlights/${matchId}`;\n      const text = `Check out the AI-generated Match Highlights!`;\n      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');\n    }, 2000);\n  };"
);

// 4. Update JSX in Share Modal
const targetJSX = `              {matchData?.clips && matchData.clips.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Share Latest Clip</label>
                  <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex items-center p-2">`;

const replacementJSX = `              {matchData?.clips && matchData.clips.length > 0 && (
                <div className="space-y-4">
                  {matchData.clips.length > 1 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Share Match Highlights Reel</label>
                      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex items-center p-2">
                        <div className="w-16 h-12 bg-black rounded flex items-center justify-center shrink-0">
                          <Film className="w-6 h-6 text-[#d11a2a]" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">Auto-generated Highlights</div>
                          <div className="text-[10px] text-slate-400">{matchData.clips.length} clips compiled</div>
                        </div>
                        <button 
                          onClick={handleGenerateAndShareHighlights}
                          disabled={generatingHighlights}
                          className="ml-2 px-3 py-1.5 bg-[#d11a2a] hover:bg-red-700 disabled:bg-red-900/50 text-white text-[10px] font-bold rounded flex items-center space-x-1"
                        >
                          {generatingHighlights ? <Loader2 className="w-3 h-3 animate-spin" /> : <Twitter className="w-3 h-3" />}
                          <span>{generatingHighlights ? 'Generating...' : 'Share Reels'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Share Latest Clip</label>
                    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex items-center p-2">`;

code = code.replace(targetJSX, replacementJSX);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
