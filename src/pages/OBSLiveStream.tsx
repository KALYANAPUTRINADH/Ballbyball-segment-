import React, { useState, useEffect } from 'react';
import { VideoPlayer } from '../components/VideoPlayer';
import { WebcamStream } from '../components/WebcamStream';
import { Settings, Info, MonitorPlay, Copy, Check, Video, Radio, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';
import { useToast } from '../components/ToastContext';

export default function OBSLiveStream({ setFullScreenView }: { setFullScreenView?: (v: string | null) => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [streamMode, setStreamMode] = useState<'rtmp' | 'virtual_camera'>('rtmp');
  const [streamKey, setStreamKey] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeStreamKey, setActiveStreamKey] = useState<string>(''); // The one passed to VideoPlayer

  useEffect(() => {
    const fetchStreamKey = async () => {
      if (user && user.uid) {
        try {
          const profile = await dbService.get('profiles', user.uid) as any;
          if (profile && profile.obs_stream_key) {
            setStreamKey(profile.obs_stream_key);
            setActiveStreamKey(profile.obs_stream_key);
          } else {
            // Fallback generation if no key exists
            const fallbackKey = `live_${user.uid.slice(0, 8)}_123456`;
            setStreamKey(fallbackKey);
            setActiveStreamKey(fallbackKey);
          }
        } catch (e) {
          console.error("Error fetching stream key:", e);
        }
      } else {
        const guestKey = 'live_guest_123456';
        setStreamKey(guestKey);
        setActiveStreamKey(guestKey);
      }
    };
    
    fetchStreamKey();
  }, [user]);

  const handleSaveStreamKey = async () => {
    if (!user || !user.uid) {
      showToast('You must be logged in to save the stream key.');
      return;
    }
    if (!streamKey.trim()) {
      showToast('Stream key cannot be empty.');
      return;
    }
    
    setIsSaving(true);
    try {
      await dbService.update('profiles', user.uid, {
        obs_stream_key: streamKey
      });
      setActiveStreamKey(streamKey);
      showToast('Stream key saved successfully!');
    } catch (e) {
      console.error("Failed to save stream key:", e);
      showToast('Error saving stream key.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const [copiedServer, setCopiedServer] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const isCloudEnvironment = typeof window !== 'undefined' && window.location.hostname.includes('run.app');
  const rtmpServerUrl = 'rtmp://streamlify.in/live';

  const handleCopy = (text: string, type: 'server' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'server') {
      setCopiedServer(true);
      setTimeout(() => setCopiedServer(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-500">
          <MonitorPlay className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight text-white">Live Stream Viewer</h1>
        </div>
        
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button 
            onClick={() => setStreamMode('virtual_camera')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${streamMode === 'virtual_camera' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Video className="w-4 h-4" /> Virtual Camera
          </button>
          <button 
            onClick={() => setStreamMode('rtmp')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${streamMode === 'rtmp' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Radio className="w-4 h-4" /> RTMP Server
          </button>
        </div>

        {setFullScreenView && (
          <button
            onClick={() => setFullScreenView(null)}
            className="text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded text-white"
          >
            Back
          </button>
        )}
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <div className="flex-1 min-h-[400px] bg-black rounded-lg overflow-hidden border border-neutral-800 shadow-xl relative flex flex-col">
            {streamMode === 'rtmp' ? (
              <VideoPlayer streamKey={activeStreamKey} />
            ) : (
              <WebcamStream />
            )}
            
            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded tracking-wider animate-pulse shadow-md z-20">
              LIVE
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Match Live Stream</h2>
            <p className="text-neutral-400 mt-1">
              {streamMode === 'rtmp' 
                ? "Waiting for OBS Studio to connect and push video to the server. The player will automatically start when the stream goes live."
                : "Select 'OBS Virtual Camera' from the dropdown to capture the stream directly from your browser."}
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
              <Settings className="w-5 h-5 text-neutral-400" />
              {streamMode === 'rtmp' ? "RTMP Broadcaster Setup" : "Virtual Camera Setup"}
            </h3>
            
            {streamMode === 'virtual_camera' ? (
              <div className="space-y-4 text-sm text-neutral-300">
                <p>The Virtual Camera captures your OBS output directly in the browser without needing to run a streaming server.</p>
                
                <ol className="list-decimal pl-4 space-y-3 marker:text-neutral-500 font-medium text-neutral-400">
                  <li>Open OBS Studio on this computer.</li>
                  <li>Set up your scenes and sources.</li>
                  <li>Click <strong className="text-white">Start Virtual Camera</strong> in the Controls dock (bottom right).</li>
                  <li>Grant camera permissions to this website when prompted.</li>
                  <li>Select <strong className="text-purple-400">OBS Virtual Camera</strong> from the dropdown menu on the video player.</li>
                </ol>
                
                <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-lg mt-6 flex gap-3 text-blue-300">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs">
                    Virtual Camera is the recommended method for cloud deployments as it bypasses firewall restrictions and provides near-zero latency.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-950/40 border border-blue-900/60 p-4 rounded-lg mb-6 text-sm text-blue-200 flex gap-3 shadow-inner">
                  <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
                  <div className="space-y-2">
                    <p>
                      <strong>Cloud Environment Notice:</strong> This preview runs in a secure cloud container that restricts incoming RTMP ports.
                    </p>
                    <p>
                      To broadcast from your local OBS Studio, you must <strong>export this app</strong> (via the Settings menu) and run it on your local machine using <code>npm run dev</code>.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">OBS RTMP Server URL</label>
                  <div className="flex rounded-lg shadow-sm">
                    <input 
                      type="text" 
                      readOnly 
                      value={rtmpServerUrl} 
                      className="bg-neutral-950 border border-neutral-800 border-r-0 rounded-l-lg p-2.5 text-xs font-mono text-green-400 flex-1 focus:outline-none" 
                    />
                    <button 
                      onClick={() => handleCopy(rtmpServerUrl, 'server')}
                      className={`px-3 py-2 border border-neutral-800 border-l rounded-r-lg text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center min-w-[70px] ${copiedServer ? 'text-emerald-500 bg-emerald-950/30' : 'text-neutral-400 bg-neutral-950'}`}
                    >
                      {copiedServer ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Stream Key</label>
                  <div className="flex rounded-lg shadow-sm">
                    <input 
                      type="text" 
                      value={streamKey} 
                      onChange={(e) => setStreamKey(e.target.value)}
                      placeholder="Enter your OBS stream key"
                      className="bg-neutral-950 border border-neutral-800 border-r-0 rounded-l-lg p-2.5 text-xs font-mono text-green-400 flex-1 focus:outline-none focus:ring-1 focus:ring-purple-500" 
                    />
                    <button 
                      onClick={() => handleCopy(streamKey, 'key')}
                      className={`px-3 py-2 border border-neutral-800 border-l rounded-none text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center min-w-[50px] ${copiedKey ? 'text-emerald-500 bg-emerald-950/30' : 'text-neutral-400 bg-neutral-950'}`}
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={handleSaveStreamKey}
                      disabled={isSaving}
                      className="px-3 py-2 border border-neutral-800 border-l rounded-r-lg text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center min-w-[70px] text-white bg-neutral-900"
                    >
                      {isSaving ? <span className="animate-spin mr-1">↻</span> : <Save className="w-4 h-4 mr-1" />} Save
                    </button>
                  </div>
                </div>
                
                <div className="pt-5 border-t border-neutral-800/80 mt-2">
                  <h4 className="text-sm font-bold text-neutral-300 mb-3 uppercase tracking-wider">How to connect</h4>
                  <ol className="text-xs text-neutral-400 space-y-3 list-decimal pl-4 marker:text-neutral-600 font-medium">
                    <li>Open OBS Studio</li>
                    <li>Go to <strong className="text-neutral-200">Settings</strong> &gt; <strong className="text-neutral-200">Stream</strong></li>
                    <li>Set Service to <strong className="text-purple-400">Custom...</strong></li>
                    <li>Paste the Server URL above</li>
                    <li>Paste the Stream Key above</li>
                    <li>Click <strong className="text-neutral-200">Start Streaming</strong></li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
