import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Replace the RTMP Ingest URL section with a clear message
rtmp_block = """                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">RTMP Ingest URL</label>
                          <div className="flex space-x-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={`rtmp://streamlify.in:1935/live`} 
                              className="bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 p-2 rounded flex-1 focus:outline-none" 
                            />
                            <button 
                              onClick={() => { 
                                navigator.clipboard.writeText(`rtmp://streamlify.in:1935/live`); 
                                setCopiedServer(true);
                                setTimeout(() => setCopiedServer(false), 2000);
                              }} 
                              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${copiedServer ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                            >
                              {copiedServer ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Stream Key</label>
                          <div className="flex space-x-2">
                            <input 
                              type={showPrivateKey ? "text" : "password"} 
                              readOnly 
                              value={`obs-stream-${matchId?.substring(0, 8) || 'test'}`}
                              className="bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 p-2 rounded flex-1 focus:outline-none" 
                            />
                            <button 
                              onClick={() => setShowPrivateKey(!showPrivateKey)}
                              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => { 
                                navigator.clipboard.writeText(`obs-stream-${matchId?.substring(0, 8) || 'test'}`); 
                                setCopiedKey(true);
                                setTimeout(() => setCopiedKey(false), 2000);
                              }} 
                              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${copiedKey ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                            >
                              {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>"""

new_rtmp_block = """                      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-slate-300 text-xs">
                        <p className="font-bold text-red-400 mb-1">RTMP Streaming Not Available</p>
                        <p className="mb-2">This cloud environment cannot host raw RTMP ports. <strong>Do NOT use "Start Streaming" in OBS.</strong></p>
                        <p className="font-bold text-emerald-400">Instead, use the Virtual Camera method:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1 text-slate-400">
                          <li>In OBS Studio, click <strong>"Start Virtual Camera"</strong>.</li>
                          <li>In this app, select <strong>"Hardware Camera"</strong> as your Video Source.</li>
                          <li>Select <strong>"OBS Virtual Camera"</strong> from the camera dropdown.</li>
                        </ol>
                      </div>"""

content = content.replace(rtmp_block, new_rtmp_block)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

