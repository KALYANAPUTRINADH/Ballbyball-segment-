import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import Hls from 'hls.js';
import { getCandidateFlvUrls, getStoredRtmpServerUrl } from '../lib/streamConfig';
import { 
  AlertCircle, 
  Play, 
  RefreshCw, 
  Radio, 
  Tv, 
  Video, 
  Monitor, 
  Link as LinkIcon, 
  HelpCircle, 
  Check, 
  Settings, 
  Sparkles,
  Volume2,
  VolumeX,
  Maximize
} from 'lucide-react';

// Permanently silence internal flv.js logging to prevent error spam in browser/console
if (flvjs.LoggingControl) {
  flvjs.LoggingControl.enableAll = false;
  flvjs.LoggingControl.enableDebug = false;
  flvjs.LoggingControl.enableVerbose = false;
  flvjs.LoggingControl.enableInfo = false;
  flvjs.LoggingControl.enableWarn = false;
  flvjs.LoggingControl.enableError = false;
}

export type StreamSourceMode = 'auto' | 'camera' | 'screen' | 'url' | 'flv' | 'sample';

interface VideoPlayerProps {
  streamKey: string;
  defaultMode?: StreamSourceMode;
  onSourceModeChange?: (mode: StreamSourceMode) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  streamKey, 
  defaultMode = 'auto',
  onSourceModeChange 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const activeMediaStreamRef = useRef<MediaStream | null>(null);

  const [activeMode, setActiveMode] = useState<StreamSourceMode>(defaultMode === 'auto' ? 'flv' : defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Camera / Device Capture states
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // URL Input states
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeUrl, setActiveUrl] = useState<string>('');

  // Sample Cricket Video List
  const SAMPLE_VIDEOS = [
    { title: 'Stadium Cricket Match (Sample 1)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
    { title: 'High Latency Test Stream (Sample 2)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  ];
  const [sampleVideoIndex, setSampleVideoIndex] = useState(0);

  // Helper to extract YouTube ID
  const getYouTubeId = (urlStr: string) => {
    if (!urlStr) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const currentStreamKeyOrUrl = activeUrl || streamKey || '';
  const youtubeId = getYouTubeId(currentStreamKeyOrUrl);

  // Clean up media tracks and players
  const stopAllStreamsAndPlayers = () => {
    if (activeMediaStreamRef.current) {
      activeMediaStreamRef.current.getTracks().forEach(track => track.stop());
      activeMediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
      } catch (e) {
        // ignore
      }
      playerRef.current = null;
    }
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        // ignore
      }
      hlsRef.current = null;
    }
  };

  // Switch modes
  const handleModeChange = (newMode: StreamSourceMode) => {
    stopAllStreamsAndPlayers();
    setError(null);
    setActiveMode(newMode);
    if (onSourceModeChange) onSourceModeChange(newMode);
  };

  // Mode 1: Camera / OBS Virtual Camera
  useEffect(() => {
    if (activeMode !== 'camera') return;

    let isMounted = true;

    async function initCamera() {
      stopAllStreamsAndPlayers();
      try {
        // First request permission to enumerate device labels
        await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {});
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        
        if (isMounted) setDevices(videoDevices);

        if (videoDevices.length === 0) {
          if (isMounted) setError('No video cameras or OBS Virtual Camera found on this computer.');
          return;
        }

        // Auto-select OBS Virtual Camera if present and no device selected yet
        let targetId = selectedDeviceId;
        if (!targetId || !videoDevices.some(d => d.deviceId === targetId)) {
          const obsDevice = videoDevices.find(d => d.label.toLowerCase().includes('obs'));
          targetId = obsDevice ? obsDevice.deviceId : videoDevices[0].deviceId;
          if (isMounted) setSelectedDeviceId(targetId);
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: targetId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        activeMediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => setNeedsUserInteraction(true));
        }
        setError(null);
      } catch (err: any) {
        if (isMounted) {
          console.error("Camera capture error:", err);
          setError("Failed to access camera/OBS Virtual Camera. Please allow camera permissions in your browser.");
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
    };
  }, [activeMode, selectedDeviceId]);

  // Mode 2: Screen Share / OBS Window
  const handleStartScreenShare = async () => {
    stopAllStreamsAndPlayers();
    setActiveMode('screen');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        },
        audio: true
      });

      activeMediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => setNeedsUserInteraction(true));
      }

      // Handle user stopping share from browser floating bar
      stream.getVideoTracks()[0].onended = () => {
        handleModeChange('flv');
      };

    } catch (err: any) {
      console.error("Screen capture error:", err);
      setError("Screen sharing cancelled or not supported.");
    }
  };

  // Mode 3: FLV Stream (RTMP Ingest)
  useEffect(() => {
    if (activeMode !== 'flv') return;

    let isMounted = true;
    let pollTimeout: any;

    if (!flvjs.isSupported()) {
      setIsSupported(false);
      setError('FLV.js is not supported in this browser.');
      return;
    }

    let raw = (currentStreamKeyOrUrl || '').trim();
    
    // Check if user passed a YouTube URL into FLV stream input
    const ytId = getYouTubeId(raw);
    if (ytId) {
      setActiveMode('url');
      return;
    }

    // Check if user passed HLS .m3u8
    if (raw.includes('.m3u8')) {
      setActiveMode('url');
      return;
    }

    let cleanKey = raw;
    if (cleanKey.includes('/')) {
      const parts = cleanKey.split('/');
      cleanKey = parts[parts.length - 1] || raw;
    }
    cleanKey = cleanKey.replace(/\.flv$/i, '').trim();

    if (!cleanKey) {
      setError('No stream key specified.');
      return;
    }

    const candidateUrls = getCandidateFlvUrls(cleanKey);
    let candidateIdx = 0;

    const initFlvPlayer = () => {
      if (!isMounted || !videoRef.current) return;

      stopAllStreamsAndPlayers();

      const candidateUrl = candidateUrls[candidateIdx % candidateUrls.length] || `/live/${cleanKey}.flv`;

      try {
        const player = flvjs.createPlayer(
          {
            type: 'flv',
            url: candidateUrl,
            isLive: true,
            cors: true,
          },
          {
            enableWorker: false,
            enableStashBuffer: false,
            stashInitialSize: 128,
            autoCleanupSourceBuffer: true,
            lazyLoad: false,
          }
        );

        player.attachMediaElement(videoRef.current);
        player.load();

        const playPromise = player.play() as Promise<void> | undefined;
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (isMounted) setNeedsUserInteraction(true);
          });
        }

        playerRef.current = player;

        player.on(flvjs.Events.ERROR, () => {
          if (!isMounted) return;
          candidateIdx++;
          setError(`Waiting for OBS RTMP stream key: "${cleanKey}"`);
          stopAllStreamsAndPlayers();

          if (pollTimeout) clearTimeout(pollTimeout);
          pollTimeout = setTimeout(initFlvPlayer, 3000);
        });

        player.on(flvjs.Events.MEDIA_INFO, () => {
          if (isMounted) setError(null);
        });

        player.on(flvjs.Events.STATISTICS_INFO, () => {
          if (isMounted && error) setError(null);
        });

      } catch (err) {
        if (isMounted) {
          candidateIdx++;
          setError(`Waiting for OBS stream on key: ${cleanKey}`);
          if (pollTimeout) clearTimeout(pollTimeout);
          pollTimeout = setTimeout(initFlvPlayer, 3000);
        }
      }
    };

    initFlvPlayer();

    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
      stopAllStreamsAndPlayers();
    };
  }, [activeMode, currentStreamKeyOrUrl]);

  // Mode 4: Custom URL / HLS
  useEffect(() => {
    if (activeMode !== 'url') return;

    let isMounted = true;
    stopAllStreamsAndPlayers();

    const targetUrl = activeUrl || streamKey;
    if (!targetUrl) {
      setError('Please enter a valid Stream or YouTube URL.');
      return;
    }

    if (youtubeId) {
      setError(null);
      return;
    }

    if (targetUrl.includes('.m3u8')) {
      if (videoRef.current) {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hls.loadSource(targetUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isMounted && videoRef.current) {
              videoRef.current.play().catch(() => setNeedsUserInteraction(true));
            }
          });
          hls.on(Hls.Events.ERROR, () => {
            if (isMounted) setError('Failed to load HLS stream.');
          });
          hlsRef.current = hls;
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = targetUrl;
          videoRef.current.play().catch(() => setNeedsUserInteraction(true));
        } else {
          setError('HLS playback is not supported in this browser.');
        }
      }
      return;
    }

    // Direct MP4 / WebM
    if (videoRef.current) {
      videoRef.current.src = targetUrl;
      videoRef.current.play().catch(() => setNeedsUserInteraction(true));
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [activeMode, activeUrl, streamKey, youtubeId]);

  const handleManualPlay = () => {
    setNeedsUserInteraction(false);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      setActiveUrl(customUrl.trim());
      handleModeChange('url');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 p-6 text-center">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <p>Your browser does not support FLV video playback.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group">
      
      {/* Top Floating Source Controls Bar */}
      <div className="absolute top-3 right-3 z-30 opacity-90 hover:opacity-100 transition-opacity bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-lg border border-neutral-800 shadow-2xl flex items-center gap-1">
        <button
          onClick={() => handleModeChange('camera')}
          title="OBS Virtual Camera / Webcam"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            activeMode === 'camera' 
              ? 'bg-purple-600 text-white font-semibold shadow-md' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>OBS Virtual Cam</span>
        </button>

        <button
          onClick={handleStartScreenShare}
          title="Share OBS Studio Window or Monitor"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            activeMode === 'screen' 
              ? 'bg-blue-600 text-white font-semibold shadow-md' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Screen Share</span>
        </button>

        <button
          onClick={() => handleModeChange('url')}
          title="YouTube or Stream URL"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            activeMode === 'url' 
              ? 'bg-red-600 text-white font-semibold shadow-md' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>URL / YouTube</span>
        </button>

        <button
          onClick={() => handleModeChange('sample')}
          title="Play Sample Live Stream"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            activeMode === 'sample' 
              ? 'bg-emerald-600 text-white font-semibold shadow-md' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Demo Match</span>
        </button>

        <button
          onClick={() => handleModeChange('flv')}
          title="RTMP Stream Ingest"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            activeMode === 'flv' 
              ? 'bg-amber-600 text-white font-semibold shadow-md' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>RTMP</span>
        </button>
      </div>

      {/* Mode 1: YouTube Embedded */}
      {activeMode === 'url' && youtubeId ? (
        <div className="relative w-full h-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube Live Stream"
          />
        </div>
      ) : activeMode === 'sample' ? (
        /* Mode 2: Sample Match Video */
        <video
          className="w-full h-full object-contain"
          src={SAMPLE_VIDEOS[sampleVideoIndex].url}
          controls
          autoPlay
          loop
          muted={isMuted}
          playsInline
        />
      ) : (
        /* Mode 3: Standard Video element (Camera / Screen Share / FLV / HLS) */
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Waiting / Setup Overlay */}
          {error && activeMode === 'flv' && (
            <div className="absolute z-20 flex flex-col items-center justify-center text-center p-6 bg-neutral-950/95 backdrop-blur-md inset-0 overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/80 flex items-center justify-center mb-3">
                <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
              </div>

              <h3 className="text-base font-bold text-white mb-1">Waiting for OBS Studio Video Stream</h3>
              <p className="text-xs text-neutral-400 max-w-md mb-4">{error}</p>
              
              <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Action Card 1: OBS Virtual Camera */}
                <button
                  onClick={() => handleModeChange('camera')}
                  className="bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 p-3.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs mb-1">
                    <Video className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    Option 1: OBS Virtual Camera
                  </div>
                  <p className="text-[11px] text-purple-200/70 leading-relaxed">
                    In OBS, click <strong className="text-white">Start Virtual Camera</strong> & capture instantly in browser with 0ms delay!
                  </p>
                </button>

                {/* Action Card 2: Screen Share */}
                <button
                  onClick={handleStartScreenShare}
                  className="bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 p-3.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-xs mb-1">
                    <Monitor className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    Option 2: Share OBS Window
                  </div>
                  <p className="text-[11px] text-blue-200/70 leading-relaxed">
                    Select your OBS Studio window or monitor screen to stream HD video directly into the app.
                  </p>
                </button>

                {/* Action Card 3: Sample Match Stream */}
                <button
                  onClick={() => handleModeChange('sample')}
                  className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 p-3.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                    <Tv className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    Option 3: Demo Match Feed
                  </div>
                  <p className="text-[11px] text-emerald-200/70 leading-relaxed">
                    Play sample video immediately to preview live scores and graphics overlays.
                  </p>
                </button>

                {/* Action Card 4: YouTube or URL */}
                <button
                  onClick={() => handleModeChange('url')}
                  className="bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 p-3.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-red-300 font-bold text-xs mb-1">
                    <LinkIcon className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    Option 4: YouTube / Stream Link
                  </div>
                  <p className="text-[11px] text-red-200/70 leading-relaxed">
                    Paste your YouTube Live link or HLS `.m3u8` video stream URL.
                  </p>
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-lg text-left max-w-lg w-full text-[11px] text-neutral-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-200 block">OBS RTMP Connection Note:</strong>
                  Cloud preview containers restrict inbound port 1935. For direct local RTMP ingest, run <code>npm run dev</code> on your machine or use <strong>OBS Virtual Camera</strong> above for 100% instant sync!
                </div>
              </div>
            </div>
          )}

          {/* Device Selection Bar for Camera mode */}
          {activeMode === 'camera' && devices.length > 0 && (
            <div className="absolute top-14 right-3 z-30 bg-neutral-900/90 backdrop-blur-md p-2 rounded-lg border border-neutral-800 flex items-center gap-2 text-xs">
              <Video className="w-4 h-4 text-purple-400" />
              <span className="text-neutral-400 font-medium">Source:</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-white rounded px-2 py-1 text-xs focus:outline-none"
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera (${d.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* URL Input Bar when Mode === 'url' and no valid stream active */}
          {activeMode === 'url' && (!activeUrl && !getYouTubeId(streamKey)) && (
            <div className="absolute z-20 flex flex-col items-center justify-center p-6 bg-neutral-950/90 backdrop-blur-md inset-0">
              <form onSubmit={handleUrlSubmit} className="w-full max-w-md bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-2xl space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-red-500" /> Enter Live Stream or YouTube URL
                </h4>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or .m3u8"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
                  >
                    Play Stream
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('flv')}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs px-3 py-2 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Manual Play Overlay */}
          {needsUserInteraction && !error && (
            <div className="absolute z-30 flex flex-col items-center justify-center text-center p-6 bg-black/80 backdrop-blur-sm inset-0">
              <button 
                onClick={handleManualPlay}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                Click to Play Live Stream
              </button>
            </div>
          )}

          {/* Video Element */}
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain" 
            controls
            muted={isMuted}
            autoPlay
            playsInline
            onPlaying={() => setError(null)}
          />

          {/* Floating Controls Overlay (Mute / Fullscreen) */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neutral-800 text-neutral-300">
            <button 
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button 
              onClick={toggleFullscreen}
              title="Fullscreen"
              className="hover:text-white transition-colors"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
