const fs = require('fs');
const content = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');
const newContent = content.replace(/<div className="p-5 space-y-6">([\s\S]*?)<div className="pt-5 border-t border-neutral-800\/80 mt-2">/, 
`<div className="p-5 space-y-6">
              <div className="bg-blue-950/40 border border-blue-900/60 p-4 rounded-lg text-sm text-blue-200 flex flex-col gap-3 shadow-inner">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
                  <p>
                    <strong>Cloud Environment Notice:</strong> You are currently running in a secure cloud environment that blocks incoming RTMP traffic (Port 1935). OBS cannot connect directly via RTMP.
                  </p>
                </div>
              </div>
              
              <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg">
                <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Recommended OBS Setup
                </h4>
                <ol className="list-decimal pl-4 space-y-3 text-sm text-neutral-300">
                  <li>Open OBS Studio on your computer.</li>
                  <li>Set up your scenes and sources as normal.</li>
                  <li>Click <strong>"Start Virtual Camera"</strong> in the controls panel.</li>
                  <li>Close this sidebar, open the <strong>Live Scoring</strong> view.</li>
                  <li>Click the <strong>Start Live Broadcast</strong> button.</li>
                  <li>In the camera list, select your <strong>OBS Virtual Camera</strong>.</li>
                </ol>
              </div>

              <div className="pt-5 border-t border-neutral-800/80 mt-2">`);
fs.writeFileSync('src/components/MatchStreamer.tsx', newContent);
