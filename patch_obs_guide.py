import re
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

old_obs_block = """        ) : externalCameraType === 'obs_rtmp' ? (
          <div className="px-4 py-3 space-y-3.5">
            {/* Live stream status banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping mr-2"></span>
                  OBS Ingest Status
                </span>
                <span className="text-xs font-black text-white mt-1">WAITING FOR ENCODER</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Ready to receive OBS RTMP stream key payload</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">OBS Transcode Mode</span>
                <span className="text-xs font-black text-white mt-1">Direct H.264 / AAC Bypass</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Hardware-accelerated RTSP transcode active</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Ingest Output</span>
                <span className="text-xs font-black text-slate-300 mt-1 truncate font-mono">
                  {`transcoded_live_${user?.uid?.slice(0, 8) || 'guest'}.m3u8`}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">Auto-mapped stream channel</span>
              </div>
            </div>

            {/* OBS Custom Stream Keys Block */}
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. RTMP Ingest Server URL</span>
                  </div>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`rtmp://a.rtmp.youtube.com/live2`} 
                      className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 p-2 rounded-lg flex-1 focus:outline-none" 
                    />
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(`rtmp://a.rtmp.youtube.com/live2`); 
                        setCopiedServer(true);
                        setTimeout(() => setCopiedServer(false), 2000);
                      }} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedServer ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                      {copiedServer ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Your Secret Stream Key</span>
                    <button 
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="text-[9px] text-slate-500 hover:text-slate-300 flex items-center"
                    >
                      {showPrivateKey ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                      {showPrivateKey ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <input 
                      type={showPrivateKey ? "text" : "password"}
                      readOnly 
                      value={`live_${user?.uid?.slice(0, 8) || 'guest'}_${customStreamKeySalt}`} 
                      className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 p-2 rounded-lg flex-1 focus:outline-none" 
                    />
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(`live_${user?.uid?.slice(0, 8) || 'guest'}_${customStreamKeySalt}`); 
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedKey ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                      {copiedKey ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">Paste these into OBS Studio Settings → Stream (Service: Custom).</p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulate OBS Feed (For Testing)</div>
              <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-1">
                {[
                  { name: '🏏 OBS Pitch Cam', desc: 'Main camera behind stumps', url: 'https://assets.mixkit.co/videos/preview/mixkit-cricket-batsman-playing-a-shot-34281-large.mp4' },
                  { name: '🏟️ OBS Boundary Zoom', desc: 'Slightly zoom camera', url: 'https://assets.mixkit.co/videos/preview/mixkit-cricket-player-hitting-a-ball-34284-large.mp4' },
                  { name: '🎙️ OBS Commentary Feed', desc: 'Presenter / Commentator view', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={async () => {
                      updateExternalCameraUrl(preset.url);
                      addStreamLog(`OBS Stream Key Transcoder: Handshaking with virtual OBS stream key feed...`);
                      setTimeout(() => {
                        addStreamLog(`OBS Stream Key Transcoder: Active RTMP key payload locked. Syncing 1080p frame buffers...`);
                      }, 800);
                    }}
                    className={`flex-shrink-0 text-left p-2.5 rounded-lg border transition-all ${externalCameraUrl === preset.url ? 'bg-purple-600/10 border-purple-500 text-purple-300 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                  >
                    <p className="font-bold text-xs flex items-center">
                      <Tv className="w-3.5 h-3.5 mr-1 text-purple-400" /> {preset.name}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>"""

new_obs_block = """        ) : externalCameraType === 'obs_rtmp' ? (
          <div className="px-4 py-3 space-y-3.5">
            <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-4">
              <h3 className="text-purple-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center">
                <Tv className="w-4 h-4 mr-2" /> How to connect OBS Studio
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                Since this is a web browser application, you do not use RTMP Stream Keys directly to get video into this app. Instead, we use <strong>OBS Virtual Camera</strong>, which streams your OBS scene directly into the browser in real-time, just like a webcam.
              </p>
              
              <div className="space-y-3">
                <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                  <span className="text-[11px] font-bold text-white block mb-1">Step 1: Start Virtual Camera in OBS</span>
                  <span className="text-[10px] text-slate-400">Open OBS Studio and click <strong>"Start Virtual Camera"</strong> in the Controls dock on the bottom right.</span>
                </div>
                
                <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                  <span className="text-[11px] font-bold text-white block mb-1">Step 2: Switch to "Local Hardware Cam" Tab</span>
                  <span className="text-[10px] text-slate-400">Click the <strong>"🌐 Network IP / Webcams"</strong> tab above.</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                  <span className="text-[11px] font-bold text-white block mb-1">Step 3: Select OBS Virtual Camera</span>
                  <span className="text-[10px] text-slate-400">In the Local Angles list, find and click on <strong>"OBS Virtual Camera"</strong>. The OBS video feed will appear in the main viewer!</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                  <span className="text-[11px] font-bold text-white block mb-1">Step 4: Click START BROADCAST</span>
                  <span className="text-[10px] text-slate-400">Once you see your OBS feed, click Start Broadcast. We use WebRTC to securely stream this feed peer-to-peer to all viewers in real-time.</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                 <button onClick={() => {
                   updateUseExternalCamera(false);
                 }} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-4 rounded transition-colors w-full">
                    Go to Network IP / Webcams Tab
                 </button>
              </div>
            </div>
          </div>"""

# Ensure we don't break regex matching by doing plain replace
if "WAITING FOR ENCODER" in content:
    content = content.replace(old_obs_block, new_obs_block)
    with open('src/components/MatchStreamer.tsx', 'w') as f:
        f.write(content)
    print("Patched OBS UI successfully")
else:
    print("Could not find the target block")

