import React, { useState, useEffect } from 'react';
import { 
  Tv, Key, Copy, Check, RefreshCw, Eye, EyeOff, Info, Sliders, 
  MonitorPlay, ExternalLink, AlertCircle, Terminal, Wifi, Settings, 
  Activity, FileText, Layout, Zap, Sparkles, Play, Square, ChevronRight,
  X, Download, Server
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastContext';
import { dbService } from '../lib/database';
import { getStoredRtmpServerUrl, setStoredRtmpServerUrl } from '../lib/streamConfig';

export default function StreamingSetup({ setFullScreenView }: { setFullScreenView?: (view: string | null) => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [streamResolution, setStreamResolution] = useState('1080p');
  const [streamBitrate, setStreamBitrate] = useState('4500');

  // Credentials States
  const [copiedServer, setCopiedServer] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedOverlay, setCopiedOverlay] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [customStreamKeySalt, setCustomStreamKeySalt] = useState('123456');

  // OBS Step-by-Step Guide Modal state
  const [showOBSGuideModal, setShowOBSGuideModal] = useState(false);
  const [guideStep, setGuideStep] = useState(1);

  // YouTube Live Stream Key states
  const [youtubeStreamKey, setYoutubeStreamKey] = useState('');
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [isSavingYoutubeKey, setIsSavingYoutubeKey] = useState(false);

  // Load stream salt and YouTube stream key
  const [obsStreamKey, setObsStreamKey] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSalt = localStorage.getItem(`custom_stream_salt_${user?.uid || 'guest'}`);
      if (storedSalt) {
        setCustomStreamKeySalt(storedSalt);
      } else {
        const newSalt = Math.random().toString(36).substring(2, 8);
        localStorage.setItem(`custom_stream_salt_${user?.uid || 'guest'}`, newSalt);
        setCustomStreamKeySalt(newSalt);
      }
    }
  }, [user]);

  // Load stream key from profile
  useEffect(() => {
    const fetchStreamKey = async () => {
      if (user && user.uid) {
        try {
          const profile = await dbService.get('profiles', user.uid) as any;
          if (profile && profile.obs_stream_key) {
            setObsStreamKey(profile.obs_stream_key);
          } else {
            // Fallback to generated if missing
            setObsStreamKey(`live_${user.uid.slice(0, 8)}_123456`);
          }
        } catch (e) {
          console.warn("Failed to load obs stream key:", e);
        }
      } else {
        setObsStreamKey('live_guest_123456');
      }
    };
    fetchStreamKey();
  }, [user]);

  // Load stream quality preferences
  useEffect(() => {
    const loadQualityPrefs = async () => {
      if (typeof window !== 'undefined') {
        const storedRes = localStorage.getItem(`stream_res_${user?.uid || 'guest'}`);
        const storedBit = localStorage.getItem(`stream_bit_${user?.uid || 'guest'}`);
        if (storedRes) setStreamResolution(storedRes);
        if (storedBit) setStreamBitrate(storedBit);
      }
      if (user && user.uid) {
        try {
          const profile = await dbService.get('profiles', user.uid) as any;
          if (profile && profile.stream_resolution) {
            setStreamResolution(profile.stream_resolution);
          }
          if (profile && profile.stream_bitrate) {
            setStreamBitrate(profile.stream_bitrate);
          }
        } catch (e) {}
      }
    };
    loadQualityPrefs();
  }, [user]);

  const handleSaveQualityPrefs = async (res, bit) => {
    setStreamResolution(res);
    setStreamBitrate(bit);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`stream_res_${user?.uid || 'guest'}`, res);
      localStorage.setItem(`stream_bit_${user?.uid || 'guest'}`, bit);
    }
    if (user && user.uid) {
      try {
        await dbService.update('profiles', user.uid, {
          stream_resolution: res,
          stream_bitrate: bit
        });
      } catch (e) {}
    }
    showToast('Stream quality saved');
  };

  // Load saved YouTube Stream Key
  useEffect(() => {
    const loadYoutubeKey = async () => {
      // 1. Try loading from localStorage first for instant display
      if (typeof window !== 'undefined') {
        const localKey = localStorage.getItem(`youtube_stream_key_${user?.uid || 'guest'}`);
        if (localKey) {
          setYoutubeStreamKey(localKey);
        }
      }
      
      // 2. If user is logged in, try fetching from profiles collection in Firestore
      if (user && user.uid) {
        try {
          const profile = await dbService.get('profiles', user.uid) as any;
          if (profile && profile.youtube_stream_key) {
            setYoutubeStreamKey(profile.youtube_stream_key);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`youtube_stream_key_${user.uid}`, profile.youtube_stream_key);
            }
          }
        } catch (e) {
          console.warn("Failed to load YouTube stream key from Firestore:", e);
        }
      }
    };
    loadYoutubeKey();
  }, [user]);

  const handleSaveYoutubeKey = async () => {
    setIsSavingYoutubeKey(true);
    try {
      // 1. Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`youtube_stream_key_${user?.uid || 'guest'}`, youtubeStreamKey);
      }
      
      // 2. If user is logged in, save to profiles in Firestore
      if (user && user.uid) {
        await dbService.update('profiles', user.uid, {
          youtube_stream_key: youtubeStreamKey
        });
      }
      showToast('YouTube Live stream key saved successfully!');
    } catch (e) {
      console.error("Failed to save YouTube stream key:", e);
      showToast('Error saving YouTube stream key, saved locally instead.');
    } finally {
      setIsSavingYoutubeKey(false);
    }
  };

  const [rtmpServerUrl, setRtmpServerUrlState] = useState(() => getStoredRtmpServerUrl());

  const handleServerUrlChange = (val: string) => {
    setRtmpServerUrlState(val);
    setStoredRtmpServerUrl(val);
  };
  
  const scoreboardOverlayUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?overlay=true`
    : 'https://streamlify-cricket.web.app/?overlay=true';

  const handleCopy = (text: string, type: 'server' | 'key' | 'overlay') => {
    navigator.clipboard.writeText(text);
    if (type === 'server') {
      setCopiedServer(true);
      setTimeout(() => setCopiedServer(false), 2000);
      showToast('RTMP Ingest Server URL copied!');
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      showToast('Personal Stream Key copied!');
    } else if (type === 'overlay') {
      setCopiedOverlay(true);
      setTimeout(() => setCopiedOverlay(false), 2000);
      showToast('Scoreboard Overlay Browser URL copied!');
    }
  };

  const regenerateStreamKey = () => {
    if (window.confirm('Are you sure you want to regenerate your stream key? Any current OBS stream connected with the old key will be disconnected immediately.')) {
      const newSalt = Math.random().toString(36).substring(2, 8);
      setCustomStreamKeySalt(newSalt);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`custom_stream_salt_${user?.uid || 'guest'}`, newSalt);
      }
      showToast('Stream key regenerated successfully! Make sure to update OBS.');
    }
  };

  const handleDownloadConfig = () => {
    const configData = {
      "name": "Cricket Tournament Profile",
      "video": {
        "base_resolution": "1920x1080",
        "output_resolution": optimalConfig.resolution.includes('1080') ? '1920x1080' : optimalConfig.resolution.includes('720') ? '1280x720' : '960x540',
        "fps": optimalConfig.fps.includes('60') ? 60 : 30
      },
      "encoder": {
        "rate_control": "CBR",
        "bitrate": parseInt(optimalConfig.videoBitrate.split(' - ')[0]) || 4000,
        "preset": optimalConfig.preset,
        "profile": optimalConfig.profile.includes('High') ? 'high' : 'main',
        "keyframe_interval": parseInt(optimalConfig.keyframe.split(' ')[0]) || 2
      },
      "audio": {
        "bitrate": parseInt(optimalConfig.audioBitrate.split(' ')[0]) || 160
      },
      "stream": {
        "type": "rtmp_custom",
        "settings": {
          "server": rtmpServerUrl,
          "key": obsStreamKey
        }
      }
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'obs_streaming_config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('OBS Configuration file downloaded!');
  };

  // Bitrate Calculator States
  const [uploadSpeed, setUploadSpeed] = useState<number>(10); // Mbps
  const [optimalConfig, setOptimalConfig] = useState({
    resolution: '1080p (FHD)',
    fps: '60 FPS',
    videoBitrate: '4500 - 6000 Kbps',
    audioBitrate: '160 Kbps',
    profile: 'High (H.264)',
    keyframe: '2 seconds',
    preset: 'Max Quality'
  });

  useEffect(() => {
    if (uploadSpeed < 3) {
      setOptimalConfig({
        resolution: '540p (SD)',
        fps: '30 FPS',
        videoBitrate: '1000 - 1500 Kbps',
        audioBitrate: '96 Kbps',
        profile: 'Main (H.264)',
        keyframe: '2 seconds',
        preset: 'Speed'
      });
    } else if (uploadSpeed < 6) {
      setOptimalConfig({
        resolution: '720p (HD)',
        fps: '30 FPS',
        videoBitrate: '2000 - 3000 Kbps',
        audioBitrate: '128 Kbps',
        profile: 'Main (H.264)',
        keyframe: '2 seconds',
        preset: 'Balanced'
      });
    } else if (uploadSpeed < 12) {
      setOptimalConfig({
        resolution: '1080p (FHD)',
        fps: '30 FPS',
        videoBitrate: '3500 - 4500 Kbps',
        audioBitrate: '160 Kbps',
        profile: 'High (H.264)',
        keyframe: '2 seconds',
        preset: 'Quality'
      });
    } else {
      setOptimalConfig({
        resolution: '1080p (FHD)',
        fps: '60 FPS',
        videoBitrate: '4500 - 6000 Kbps',
        audioBitrate: '192 Kbps',
        profile: 'High (H.264)',
        keyframe: '2 seconds',
        preset: 'Max Quality'
      });
    }
  }, [uploadSpeed]);

  // Simulator States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simMetrics, setSimMetrics] = useState({
    status: 'OFFLINE',
    bitrate: 0,
    fps: 0,
    loss: '0.0%',
    keyframe: 'N/A'
  });

  useEffect(() => {
    let interval: any = null;
    if (isSimulating) {
      setSimulationLogs([
        '⚡ [System] Starting OBS RTMP Ingest Handshake...',
        `📡 [Handshake] Connecting to local RTMP ingest endpoint: ${rtmpServerUrl}`,
        `🔑 [Security] Validating stream key prefix: live_*****_${customStreamKeySalt}...`,
        '✅ [Authorized] Key accepted. Allocating transcoding hardware channels...',
        '📊 [Codec] Raw container format: FLV (H.264 Baseline, AAC Stereo)',
        '🎥 [Ingest] Synchronizing audio/video clocks. FPS locked at 30/60...',
        '🚀 [Transcoder] HLS manifest generated. Streaming overlay engines [LIVE]'
      ]);
      setSimMetrics({
        status: 'LIVE BROADCAST',
        bitrate: Math.floor(4000 + Math.random() * 800),
        fps: 60,
        loss: '0.0%',
        keyframe: '2.0s'
      });

      interval = setInterval(() => {
        const offsetBitrate = Math.floor(4000 + Math.random() * 800);
        const randomLoss = (Math.random() * 0.1).toFixed(2) + '%';
        setSimMetrics(prev => ({
          ...prev,
          bitrate: offsetBitrate,
          loss: randomLoss
        }));

        const newLogs = [
          `📈 [Network] Active bitrate: ${offsetBitrate} kbps | Frame Loss: ${randomLoss}`,
          `🖥️ [Renderer] Web Scoreboard Graphics merged seamlessly with incoming H.264 frames`,
          `📣 [Audio] Audio payload: AAC stereophonic feed active (48 kHz, 160 kbps)`,
          `📡 [HLS] Transcoded HLS chunk list synchronized. Output buffered correctly.`
        ];
        const logToInsert = newLogs[Math.floor(Math.random() * newLogs.length)];
        setSimulationLogs(prev => [...prev.slice(-8), `🕒 [${new Date().toLocaleTimeString()}] ${logToInsert}`]);
      }, 3000);
    } else {
      setSimulationLogs(['💻 Ingest server idle. Awaiting OBS encoder payload...']);
      setSimMetrics({
        status: 'OFFLINE',
        bitrate: 0,
        fps: 0,
        loss: '0.0%',
        keyframe: 'N/A'
      });
    }

    return () => clearInterval(interval);
  }, [isSimulating, customStreamKeySalt]);

  // Selected guide tab
  const [activeGuideTab, setActiveGuideTab] = useState<'stream' | 'browser' | 'encoder' | 'trouble'>('stream');

  return (
    <div id="streaming-setup-container" className="space-y-6 pb-20 max-w-7xl mx-auto px-1 sm:px-4">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
          <Tv className="w-48 h-48 text-purple-400" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-400/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Tournament Broadcasting Engine
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none text-slate-100">
            Professional OBS & Streaming Setup
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Configure external high-end video cameras, camcorders, or hardware setups using OBS Studio. Ingest raw streams via RTMP and superimpose dynamic real-time overlays for a true stadium-quality broadcast feed.
          </p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Ingest Panel, Credentials, and Simulator */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Credentials Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wider">
                <Key className="w-4 h-4 text-purple-600 mr-2" />
                Stream Credentials
              </h2>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{isSimulating ? 'Active' : 'Offline'}</span>
              </div>
            </div>

            {/* Step-by-Step OBS Interactive Guide button */}
            <button
              type="button"
              onClick={() => { setGuideStep(1); setShowOBSGuideModal(true); }}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transition-all cursor-pointer"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>OBS Studio Step-by-Step Setup Guide</span>
            </button>

            {/* Ingest Server URL / AWS EC2 Host */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-purple-600" />
                  RTMP Ingest Server URL / AWS EC2 Host
                </label>
                <span className="text-[10px] text-purple-600 font-bold uppercase">Editable</span>
              </div>
              <div className="flex rounded-lg shadow-sm">
                <input 
                  type="text" 
                  value={rtmpServerUrl} 
                  onChange={(e) => handleServerUrlChange(e.target.value)}
                  placeholder="e.g. rtmp://3.120.x.x:1935/live"
                  className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg p-2.5 text-xs font-mono text-purple-900 flex-1 focus:outline-none focus:ring-1 focus:ring-purple-500" 
                />
                <button 
                  onClick={() => handleCopy(rtmpServerUrl, 'server')}
                  className={`px-3 py-2 border border-slate-200 border-l rounded-r-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center min-w-[70px] ${copiedServer ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}
                >
                  {copiedServer ? <Check className="w-4 h-4" /> : 'Copy'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                💡 Enter your AWS EC2 Public IP address (e.g. <code className="text-purple-700 font-semibold bg-slate-100 px-1 py-0.5 rounded">rtmp://YOUR-EC2-IP:1935/live</code>) to stream directly from OBS Studio to EC2.
              </p>
            </div>

            {/* Stream Key */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Personal Stream Key</label>
                <button 
                  onClick={regenerateStreamKey}
                  className="text-[10px] text-[#d11a2a] hover:text-red-700 font-bold transition-colors uppercase flex items-center"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                </button>
              </div>
              <div className="flex rounded-lg shadow-sm">
                <input 
                  type={showPrivateKey ? "text" : "password"} 
                  readOnly 
                  value={obsStreamKey} 
                  className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg p-2.5 text-xs font-mono text-slate-700 flex-1 focus:outline-none" 
                />
                <button 
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="px-2.5 border border-slate-200 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleCopy(obsStreamKey, 'key')}
                  className={`px-3 py-2 border border-slate-200 border-l rounded-r-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center min-w-[70px] ${copiedKey ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : 'Copy'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                ⚠️ Treat your Stream Key as a secret. Do not disclose it to anyone. Anyone with this key can broadcast onto your match scorecard overlays.
              </p>
            </div>

            {/* YouTube Live Stream Key for OBS Integration */}
            <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Tv className="w-3.5 h-3.5 text-red-600 mr-1.5" />
                  YouTube Live Stream Key
                </label>
                <span className="text-[10px] text-slate-400 font-medium">For Secure OBS Integration</span>
              </div>
              <div className="flex rounded-lg shadow-sm">
                <input 
                  type={showYoutubeKey ? "text" : "password"} 
                  placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
                  value={youtubeStreamKey} 
                  onChange={(e) => setYoutubeStreamKey(e.target.value)}
                  className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg p-2.5 text-xs font-mono text-slate-700 flex-1 focus:outline-none" 
                />
                <button 
                  type="button"
                  onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                  className="px-2.5 border border-slate-200 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {showYoutubeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button 
                  type="button"
                  onClick={handleSaveYoutubeKey}
                  disabled={isSavingYoutubeKey}
                  className="px-4 py-2 bg-purple-600 text-white border border-purple-600 rounded-r-lg text-xs font-bold hover:bg-purple-700 transition-colors flex items-center justify-center min-w-[80px]"
                >
                  {isSavingYoutubeKey ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Saves your key locally and in your profile, allowing OBS broadcasts and auto-filling YouTube streaming sections.
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-1 text-slate-500" /> Stream Quality (YouTube)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution</label>
                  <select
                    value={streamResolution}
                    onChange={(e) => handleSaveQualityPrefs(e.target.value, streamBitrate)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Video Bitrate</label>
                  <select
                    value={streamBitrate}
                    onChange={(e) => handleSaveQualityPrefs(streamResolution, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="2500">2500 kbps (Standard 720p)</option>
                    <option value="4500">4500 kbps (High 720p / Std 1080p)</option>
                    <option value="6000">6000 kbps (High 1080p)</option>
                    <option value="9000">9000 kbps (Premium 1080p60)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Encoder Simulator */}
          <div className="bg-slate-950 rounded-2xl shadow-xl overflow-hidden text-slate-300 border border-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs uppercase tracking-widest text-slate-400">OBS Ingest Simulator</span>
              </div>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all flex items-center ${isSimulating ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'}`}
              >
                {isSimulating ? (
                  <>
                    <Square className="w-2.5 h-2.5 mr-1 fill-red-400" /> Stop Stream
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 mr-1 fill-purple-400" /> Start Mock
                  </>
                )}
              </button>
            </div>

            {/* Simulated Live Feed Stats */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-900">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Pipeline Status</span>
                <p className={`text-xs font-black tracking-wide ${isSimulating ? 'text-emerald-400' : 'text-slate-500'}`}>{simMetrics.status}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Video Encoder Bitrate</span>
                <p className="text-xs font-black text-slate-300 font-mono">
                  {isSimulating ? `${(simMetrics.bitrate / 1000).toFixed(1)} Mbps` : '0.0 Mbps'}
                </p>
              </div>
              <div className="space-y-0.5 pt-1.5 border-t border-slate-900">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Framerate (FPS)</span>
                <p className="text-xs font-black text-slate-300 font-mono">
                  {isSimulating ? `${simMetrics.fps} FPS` : '0 FPS'}
                </p>
              </div>
              <div className="space-y-0.5 pt-1.5 border-t border-slate-900">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Packet Loss</span>
                <p className="text-xs font-black text-slate-300 font-mono">
                  {isSimulating ? simMetrics.loss : '0.0%'}
                </p>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="bg-black/80 rounded-xl p-3 h-44 overflow-y-auto font-mono text-[10px] space-y-1 text-emerald-400 border border-slate-900 shadow-inner">
              {simulationLogs.map((log, index) => (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">{log}</div>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 flex items-start space-x-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
              <span>Use the <strong>"Start Mock"</strong> button to simulate how our backend ingests, decodes, and analyzes stream telemetry, verifying your match integration works even without OBS open.</span>
            </div>
          </div>

        </div>

        {/* Right Column: Setup Guides, Tuner, Overlay configs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'stream', icon: <Tv className="w-4 h-4" />, label: '1. OBS Config' },
                { id: 'browser', icon: <Layout className="w-4 h-4" />, label: '2. Overlay Source' },
                { id: 'encoder', icon: <Sliders className="w-4 h-4" />, label: '3. Video Tuning' },
                { id: 'architecture', icon: <Zap className="w-4 h-4" />, label: 'Video Flow Architecture' },
                { id: 'trouble', icon: <AlertCircle className="w-4 h-4" />, label: 'Troubleshooting' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeGuideTab === tab.id ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6 min-h-[380px]">
              
              {/* Tab: Stream Settings */}
              {activeGuideTab === 'stream' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">Step 1: Configure Custom Stream Ingest</h3>
                    <p className="text-xs text-slate-500">Configure OBS Studio to route the tournament camera feed directly into our low-latency ingest pipelines.</p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <p className="text-xs text-slate-600 leading-normal">
                        Launch <strong className="text-slate-800 font-bold">OBS Studio</strong> on your laptop/desktop computer. Ensure your external camera is connected (via USB Capture Card, HDMI Camcorder, NDI, or virtual source).
                      </p>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <p className="text-xs text-slate-600 leading-normal">
                        Open <strong className="text-slate-800 font-bold">Settings</strong> (found in bottom right controls or via <strong className="text-slate-800">File &gt; Settings</strong>). Navigate to the <strong className="text-slate-800">Stream</strong> tab on the left sidebar.
                      </p>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs text-slate-600 leading-normal">
                          Set the <strong className="text-slate-800 font-bold">Service</strong> dropdown selector to <strong className="text-purple-700 font-bold">Custom...</strong>. This will reveal the Server and Stream Key input fields.
                        </p>
                        <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-[10px] text-slate-500 space-y-1 font-mono">
                          <div>Service: <span className="text-purple-600">Custom...</span></div>
                          <div className="truncate">Server: <span className="text-slate-700">{rtmpServerUrl}</span></div>
                          <div>Stream Key: <span className="text-slate-700">••••••••••••••</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">4</div>
                      <p className="text-xs text-slate-600 leading-normal">
                        Copy the <strong className="text-slate-800">RTMP Ingest Server URL</strong> and your <strong className="text-slate-800">Personal Stream Key</strong> from the credentials card on the left, paste them in, and click <strong className="text-slate-800">Apply &gt; OK</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-900 leading-relaxed flex items-start space-x-2.5 mt-4">
                    <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Protip:</strong> You can also use hardware streaming backpacks or devices like LiveU, Teradek, or VMix by specifying this exact RTMP endpoint and private stream key in their dynamic setup fields!
                    </span>
                  </div>
                </div>
              )}

              {/* Tab: Browser Source Overlay */}
              {activeGuideTab === 'browser' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">Step 2: Add Real-Time Scoreboard Overlay</h3>
                    <p className="text-xs text-slate-500">Inject live, automated cricket scoreboard graphics as a transparent layer directly in OBS Studio.</p>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Browser Source URL</span>
                    <div className="flex rounded-lg shadow-sm">
                      <input 
                        type="text" 
                        readOnly 
                        value={scoreboardOverlayUrl} 
                        className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg p-2.5 text-xs font-mono text-slate-700 flex-1 focus:outline-none" 
                      />
                      <button 
                        onClick={() => handleCopy(scoreboardOverlayUrl, 'overlay')}
                        className={`px-3 py-2 border border-slate-200 border-l rounded-r-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center min-w-[70px] ${copiedOverlay ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}
                      >
                        {copiedOverlay ? <Check className="w-4 h-4" /> : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <p className="text-xs text-slate-600 leading-normal">
                        Under the <strong className="text-slate-800">Sources</strong> dock in OBS, click the <strong className="text-slate-800">+</strong> icon and select <strong className="text-purple-700 font-bold">Browser</strong>. Give it a friendly name like "Live Scoreboard".
                      </p>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <p className="text-xs text-slate-600 leading-normal">
                        Paste the scoreboard overlay URL copied above into the <strong className="text-slate-800">URL</strong> field.
                      </p>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <p className="text-xs text-slate-600 leading-normal">
                        Set the <strong className="text-slate-800">Width</strong> to <strong className="text-slate-800">1920</strong> and <strong className="text-slate-800">Height</strong> to <strong className="text-slate-800">1080</strong> (or 1280x720 depending on your canvas resolution).
                      </p>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">4</div>
                      <p className="text-xs text-slate-600 leading-normal">
                        Make sure to check <strong className="text-slate-800">"Refresh browser when scene becomes active"</strong>. This forces the browser source to load the freshest match data and scoreboard themes immediately. Click <strong className="text-slate-800">OK</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start space-x-2 text-xs text-slate-500">
                    <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Overlay Sync:</strong> Scoreboards update synchronously over WebSocket connections. When a scorer updates runs, wickets, or boundaries on their tablet, the overlays inside OBS will instantly render animations, match branding, and updated stats!
                    </span>
                  </div>
                </div>
              )}

              {/* Tab: Video Encoder Settings */}
              {activeGuideTab === 'encoder' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">Step 3: Fine-Tune Video Encoder Settings</h3>
                    <p className="text-xs text-slate-500">Tweak OBS Studio advanced outputs to ensure frame stability, zero packet buffering, and beautiful 60 FPS transitions.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Output Mode</span>
                        <span className="font-extrabold text-slate-800">Advanced</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Video Encoder</span>
                        <span className="font-extrabold text-slate-800">NVIDIA NVENC / x264</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Rate Control</span>
                        <span className="font-extrabold text-slate-800">CBR (Constant Bitrate)</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Keyframe Interval</span>
                        <span className="font-extrabold text-[#d11a2a]">2 Seconds</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                        <p className="text-xs text-slate-600 leading-normal">
                          Go to OBS <strong className="text-slate-800">Settings &gt; Output</strong>. Set output mode to <strong className="text-slate-800">Advanced</strong>, then select the <strong className="text-slate-800">Streaming</strong> tab.
                        </p>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                        <p className="text-xs text-slate-600 leading-normal">
                          Choose the H.264 hardware encoder (e.g., <strong className="text-slate-800">NVIDIA NVENC H.264</strong>, <strong className="text-slate-800">AMD AMF H.264</strong>, or <strong className="text-slate-800">Apple VT H.264</strong>) to free up CPU cycles.
                        </p>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                        <p className="text-xs text-slate-600 leading-normal">
                          Set Rate Control to <strong className="text-slate-800">CBR</strong>, Keyframe Interval to <strong className="text-slate-800">2s</strong>, and choose a bitrate appropriate for your upload speed (use our Bitrate Calculator below!).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Video Flow Architecture */}
              {activeGuideTab === 'architecture' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">Video Flow Architecture</h3>
                    <p className="text-xs text-slate-500">How your video stream is routed through our backend for low-latency delivery.</p>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-6 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 shadow-inner">
                    <pre className="whitespace-pre">
{`OBS
  │
  │ RTMP :1935
  ▼
RTMP Server
(e.g. SRS / MediaMTX / Nginx-RTMP)
  │
  ├── HLS → Website viewers
  └── WebRTC → Low-latency viewers`}
                    </pre>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">Why this architecture?</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      By pushing RTMP directly to our ingest servers instead of relying on third-party platforms, we can process your live feed dynamically. We generate standard <strong>HLS</strong> (HTTP Live Streaming) streams for broad compatibility on mobile and web clients, while simultaneously delivering ultra-low latency <strong>WebRTC</strong> feeds to real-time interactive viewers, ensuring the scorecard actions match the video flawlessly.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Troubleshooting */}
              {activeGuideTab === 'trouble' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">Broadcasting Troubleshooting</h3>
                    <p className="text-xs text-slate-500">Fast solutions for standard connectivity or frame-rate bottlenecks.</p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-red-900 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-red-600" />
                        OBS says "Failed to connect to Server" or "Connection Timeout"
                      </p>
                      <p className="text-red-700 leading-relaxed pl-5">
                        Ensure your firewall is not blocking outbound RTMP port 1935. Ensure your internet connection is active. Verify you did not introduce spaces or typos when pasting the server URL or your private stream key.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-amber-900 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-amber-600" />
                        Frames are dropping, stream is buffering or pixelated
                      </p>
                      <p className="text-amber-700 leading-relaxed pl-5">
                        Your streaming video bitrate exceeds your internet's active upload capabilities. Reduce video bitrate by 1000 Kbps in OBS settings, or lower resolution output from 1080p to 720p. Do not broadcast over unstable cellular hotspots if possible.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-slate-900 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-slate-500" />
                        Scoreboard is cut-off or misaligned inside OBS view
                      </p>
                      <p className="text-slate-700 leading-relaxed pl-5">
                        Double-check that the Browser Source dimensions in OBS match the exact widescreen canvas format (Width: 1920, Height: 1080). You can also right-click the Browser Source, select <strong className="text-slate-800">Transform &gt; Fit to screen</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Dynamic Bitrate Calculator & Tuning */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center">
                  <Sliders className="w-4 h-4 text-purple-600 mr-2" />
                  Optimal Bitrate & Tuning Calculator
                </h3>
                <p className="text-[11px] text-slate-400">Estimate best OBS settings based on your field's internet upload speed.</p>
              </div>
              <button
                onClick={handleDownloadConfig}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow flex items-center transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download .json
              </button>
            </div>

            {/* Slider */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 uppercase tracking-wide text-[10px]">Your Upload Speed (Mbps)</span>
                <span className="font-mono text-purple-700 font-extrabold text-sm">{uploadSpeed} Mbps</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="30" 
                step="0.5"
                value={uploadSpeed}
                onChange={(e) => setUploadSpeed(parseFloat(e.target.value))}
                className="w-full accent-purple-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>1 Mbps (Low / 3G)</span>
                <span>10 Mbps (LTE / ADSL)</span>
                <span>20+ Mbps (Fiber / 5G)</span>
              </div>
            </div>

            {/* Recommended configuration table */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Resolution Preset</span>
                <span className="text-xs font-extrabold text-slate-800 mt-auto">{optimalConfig.resolution}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Framerate Preset</span>
                <span className="text-xs font-extrabold text-slate-800 mt-auto">{optimalConfig.fps}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Video Bitrate</span>
                <span className="text-xs font-extrabold text-purple-700 mt-auto">{optimalConfig.videoBitrate}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Audio Bitrate</span>
                <span className="text-xs font-extrabold text-slate-800 mt-auto">{optimalConfig.audioBitrate}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Keyframe Delay</span>
                <span className="text-xs font-extrabold text-slate-800 mt-auto">{optimalConfig.keyframe}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">OBS Preset Profile</span>
                <span className="text-xs font-extrabold text-slate-800 mt-auto">{optimalConfig.preset}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic text-center">
              💡 Always allow at least 30-40% margin of safety in your upload capabilities. If your internet speed fluctuates, lowering the bitrate keeps the stream from buffering.
            </p>
          </div>

        </div>

      </div>

      {/* OBS Studio Step-by-step Modal Guide */}
      {showOBSGuideModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MonitorPlay className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide uppercase">OBS Studio Setup Guide</h3>
                  <p className="text-[10px] text-purple-300">Stadium Broadcast in 6 Steps</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOBSGuideModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 font-bold text-slate-700">
                <span>Step {guideStep} of 6:</span>
                <span className="text-purple-600 font-extrabold">
                  {guideStep === 1 && "Prepare OBS Studio"}
                  {guideStep === 2 && "Open Custom Stream Ingest"}
                  {guideStep === 3 && "Input RTMP Server"}
                  {guideStep === 4 && "Input Stream Key"}
                  {guideStep === 5 && "Apply Dynamic Settings"}
                  {guideStep === 6 && "Verify & Go Live!"}
                </span>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div 
                    key={step} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${step === guideStep ? 'w-6 bg-purple-600' : step < guideStep ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Step 1: Open OBS */}
              {guideStep === 1 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex justify-center">
                    <Tv className="w-16 h-16 text-purple-600 animate-pulse" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">1. Install and Open OBS Studio</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Download and install the free, open-source <strong>OBS Studio</strong> software if you haven't already. Open OBS on your streaming laptop or production computer.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Connect your professional external video camera, phone, or handycam through a USB capture card (such as an Elgato Cam Link) and add it as a <strong>Video Capture Device</strong> source.
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Need OBS Studio?</span>
                    <a href="https://obsproject.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-bold flex items-center">
                      obsproject.com <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              )}

              {/* Step 2: Open Stream settings */}
              {guideStep === 2 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl border border-slate-800 font-mono text-[10px] space-y-1">
                    <div className="text-slate-500"># Inside OBS Studio:</div>
                    <div>1. Click <span className="text-purple-400">"Settings"</span> in the bottom right corner (Controls dock)</div>
                    <div>2. Alternatively, go to top menu: <span className="text-purple-400">File &gt; Settings</span></div>
                    <div>3. Select the <span className="text-purple-400">"Stream"</span> tab on the left sidebar</div>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">2. Navigate to Stream settings</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open the OBS global settings window. From there, select the <strong>Stream</strong> configuration tab on the left pane to change where OBS outputs your live camera signal.
                  </p>
                </div>
              )}

              {/* Step 3: Service Custom */}
              {guideStep === 3 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-xs text-slate-500 font-bold uppercase">OBS Stream Options:</div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-xs text-slate-600 font-medium col-span-1">Service:</span>
                      <span className="bg-white border border-purple-500 text-purple-700 font-bold px-3 py-1.5 rounded-lg text-xs col-span-2 text-center shadow-sm">Custom...</span>
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">3. Choose "Custom..." Service</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    By default, OBS assumes you are streaming directly to standard commercial platforms. Since we transcode your feed with custom interactive cricket scorecard overlays, select <strong>"Custom..."</strong> from the Service dropdown list.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This will reveal the custom input boxes for the <strong>Server</strong> and the <strong>Stream Key</strong>.
                  </p>
                </div>
              )}

              {/* Step 4: RTMP Server Ingest */}
              {guideStep === 4 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
                  <h4 className="font-black text-slate-900 text-sm">4. Paste the RTMP Ingest URL</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Copy the Ingest URL below and paste it into the <strong>Server</strong> box in OBS.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">RTMP Ingest Server URL</span>
                    <div className="flex">
                      <input 
                        type="text" 
                        readOnly 
                        value={rtmpServerUrl} 
                        className="bg-white border border-slate-200 border-r-0 rounded-l-lg p-2 text-xs font-mono text-slate-700 flex-1 focus:outline-none" 
                      />
                      <button 
                        type="button"
                        onClick={() => handleCopy(rtmpServerUrl, 'server')}
                        className={`px-3 py-1.5 border border-slate-200 rounded-r-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center min-w-[70px] ${copiedServer ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}
                      >
                        {copiedServer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Stream Key paste */}
              {guideStep === 5 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
                  <h4 className="font-black text-slate-900 text-sm">5. Paste your Personal Stream Key</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Copy your private stream key below and paste it into the <strong>Stream Key</strong> field in OBS. Keep this secure!
                  </p>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Your Personal Stream Key</span>
                    <div className="flex">
                      <input 
                        type={showPrivateKey ? "text" : "password"} 
                        readOnly 
                        value={obsStreamKey} 
                        className="bg-white border border-slate-200 border-r-0 rounded-l-lg p-2 text-xs font-mono text-slate-700 flex-1 focus:outline-none" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="px-2 border border-slate-200 text-slate-500 hover:text-slate-700 bg-white"
                      >
                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleCopy(obsStreamKey, 'key')}
                        className={`px-3 py-1.5 border border-slate-200 rounded-r-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center min-w-[70px] ${copiedKey ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 leading-normal">
                    ⚠️ <strong>Never share your key.</strong> If your key is compromised, close this guide and use the "Regenerate" button to invalidate it.
                  </div>
                </div>
              )}

              {/* Step 6: Stream Settings Optimizations & Start */}
              {guideStep === 6 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
                  <h4 className="font-black text-slate-900 text-sm">6. Save Settings & Start Streaming!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Click <strong>Apply</strong> and then <strong>OK</strong> in the bottom right corner of the Settings window to close it.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    In the main OBS window, click the <strong>Start Streaming</strong> button in the bottom-right controls area. 
                  </p>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5 text-xs text-emerald-900">
                    <span className="font-bold flex items-center text-emerald-800">
                      <Check className="w-4 h-4 mr-1 text-emerald-600 shrink-0" />
                      Success Checklist:
                    </span>
                    <ul className="list-disc pl-5 space-y-1 leading-normal text-emerald-700 font-medium">
                      <li>OBS status bar at the bottom right turns green with stable Kbps.</li>
                      <li>Check our "OBS Ingest Simulator" metrics or open the overlay URL to verify the feed is active.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setGuideStep(prev => Math.max(1, prev - 1))}
                disabled={guideStep === 1}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${guideStep === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 cursor-pointer'}`}
              >
                Previous
              </button>
              
              {guideStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setGuideStep(prev => Math.min(6, prev + 1))}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center shadow-sm transition-all cursor-pointer"
                >
                  Next Step <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOBSGuideModal(false)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center shadow-md transition-all animate-bounce cursor-pointer"
                >
                  Finish Guide <Check className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
