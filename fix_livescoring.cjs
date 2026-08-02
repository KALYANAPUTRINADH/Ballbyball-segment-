const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

// Fix MatchTabs (Insights)
code = code.replace(/\{!isCompactMode && !isBroadcastMode && isOwner && \(\n\s*<MatchTabs/, "{!isCompactMode && !isBroadcastMode && (\n          <MatchTabs");

// Fix Right column - Scorer Panel
const scorerPanelStart = `              <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Scorer Panel</h3>`;
                    
const fixedScorerPanelStart = `              {isOwner ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Scorer Panel</h3>`;

code = code.replace(scorerPanelStart, fixedScorerPanelStart);

const scorerPanelEnd = `                  )}
                </>
              
              {/* Match Context Mini */}`;

const fixedScorerPanelEnd = `                  )}
                </>
              ) : (
                <div className="space-y-5 py-4 text-center">
                  <div className="mx-auto w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#d11a2a]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-950">Viewer Mode Active</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Scoring is restricted. Only <span className="font-semibold text-slate-800">{ownerName || 'the match creator'}</span> has permission to score and update live stats.
                    </p>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                    <div className="flex items-center justify-center space-x-2 text-xs text-emerald-800 font-bold mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Real-Time Sync Active</span>
                    </div>
                    <p className="text-[10px] text-emerald-600 leading-normal font-medium">
                      All scores, overs, batsman stats, and bowler updates sync automatically on your screen as they happen.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Match Context Mini */}`;

code = code.replace(scorerPanelEnd, fixedScorerPanelEnd);

fs.writeFileSync('src/components/LiveScoring.tsx', code);
