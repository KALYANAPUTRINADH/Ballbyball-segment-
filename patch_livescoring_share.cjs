const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

const shareModalOld = `              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Share Via</label>
                <div className="flex justify-center space-x-4">
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button onClick={handleNativeShare} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-700" title="Native Share">
                      <Share2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={shareToWhatsApp} className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors text-green-600" title="WhatsApp">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button onClick={shareToTwitter} className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center hover:bg-sky-200 transition-colors text-sky-500" title="Twitter">
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button onClick={shareToFacebook} className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors text-blue-600" title="Facebook">
                    <Facebook className="w-5 h-5" />
                  </button>
                </div>
              </div>`;

const shareModalNew = `              <div className="pt-4 border-t border-slate-100">
                <ShareImageCard 
                  matchData={{
                    teamA,
                    teamB,
                    runs,
                    wickets,
                    overs,
                    balls,
                    target,
                    scoreA,
                    scoreB,
                    inningsScores
                  }} 
                  sportType={sportType} 
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Share Link Via</label>
                <div className="flex justify-center space-x-4">
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button onClick={handleNativeShare} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-700" title="Native Share">
                      <Share2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={shareToWhatsApp} className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors text-green-600" title="WhatsApp">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button onClick={shareToTwitter} className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center hover:bg-sky-200 transition-colors text-sky-500" title="Twitter">
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button onClick={shareToFacebook} className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors text-blue-600" title="Facebook">
                    <Facebook className="w-5 h-5" />
                  </button>
                </div>
              </div>`;

code = code.replace(shareModalOld, shareModalNew);

fs.writeFileSync('src/components/LiveScoring.tsx', code);
