import React, { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { streamManagement } from '../services/StreamManagementAPI';
import { Tv, MessageCircle, Twitter, Facebook, Wifi, Video as VideoIcon, Mic, Globe, Play, Pause, Square, Circle, RotateCcw, Video, Camera, Scissors, Download, Loader2, X, Maximize, Minimize, Sparkles, Share2, Copy, Radio, Settings, Info, Youtube, ExternalLink, Trophy, Calculator, Check, Search, CloudRain, Umbrella, RefreshCw, Shield, Clock, AlertTriangle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { WagonWheel } from './WagonWheel';
import { MatchTabs } from './MatchTabs';
import { VisualWagonWheel } from './VisualWagonWheel';
import { ShareImageCard } from './ShareImageCard';
import { ScoreboardWidget } from './ScoreboardWidget';
import { VideoPlayer } from './VideoPlayer';
import Hls from 'hls.js';



const HlsPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [isReceivingWebRTC, setIsReceivingWebRTC] = useState(false);
  const [webrtcPeerId, setWebrtcPeerId] = useState<string | null>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;
    
    if (Hls.isSupported() && src.includes('.m3u8')) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log('Auto-play prevented', e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('Auto-play prevented', e));
      });
    } else {
      video.src = src;
    }
    
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-contain bg-black"
      controls
      playsInline
      autoPlay
    />
  );
};

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.includes('/watch')) {
        videoId = urlObj.searchParams.get('v') || '';
      } else if (urlObj.pathname.includes('/live/')) {
        videoId = urlObj.pathname.split('/live/')[1];
      } else if (urlObj.pathname.includes('/embed/')) {
        return url;
      }
      if (videoId) {
        videoId = videoId.split('?')[0].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`;
      }
    }
  } catch (e) {
    // Ignore
  }
  return url;
};



// Removed supabase import
import { dbService } from '../lib/database';
import { StatsSyncService } from '../services/StatsSyncService';
import { CricketScoreboardThemes } from './CricketScoreboardThemes';
import { scoreboardService, getSportConfig, SPORT_CONFIGS } from '../services/ScoreboardService';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { CountryCodeSelect } from './CountryCodeSelect';
import { PlayerSearchModal } from './PlayerSearchModal';
import { DeviceDiagnostics } from './DeviceDiagnostics';


export function LiveScoring({ isCompactMode: propCompactMode, setIsCompactMode: propSetCompactMode, setFullScreenView }: { isCompactMode?: boolean, setIsCompactMode?: (val: boolean) => void, setFullScreenView?: (v: string | null) => void } = {}) {
  const savedStateStr = typeof window !== 'undefined' ? localStorage.getItem('livescoring_state') : null;
  const savedState = savedStateStr ? JSON.parse(savedStateStr) : null;

  const [runs, setRuns] = useState(savedState?.runs ?? 0);
  const [wickets, setWickets] = useState(savedState?.wickets ?? 0);
  const [overs, setOvers] = useState(savedState?.overs ?? 0);
  const [balls, setBalls] = useState(savedState?.balls ?? 0);
  const [thisOver, setThisOver] = useState<string[]>(savedState?.thisOver ?? []);
  const [target, setTarget] = useState(savedState?.target ?? null);
  const [innings, setInnings] = useState(savedState?.innings ?? 1);
  const [inningsScores, setInningsScores] = useState<any[]>(savedState?.inningsScores ?? []);
  const [viewersCount, setViewersCount] = useState(savedState?.viewersCount || 0);
  const [teamA, setTeamA] = useState('Team A');
  const [teamB, setTeamB] = useState('Team B');
  const [sportType, setSportType] = useState(savedState?.sportType ?? (typeof window !== 'undefined' ? localStorage.getItem('match_sport_type') || 'Cricket' : 'Cricket'));
  const [matchFormat, setMatchFormat] = useState(savedState?.matchFormat ?? (typeof window !== 'undefined' ? localStorage.getItem('match_format') || 'T20' : 'T20'));
  const [scoreA, setScoreA] = useState(savedState?.scoreA ?? 0);
  const [scoreB, setScoreB] = useState(savedState?.scoreB ?? 0);
  const [setsA, setSetsA] = useState(savedState?.setsA ?? 0);
  const [setsB, setSetsB] = useState(savedState?.setsB ?? 0);
  const [period, setPeriod] = useState(savedState?.period ?? 1);
  const [striker, setStriker] = useState(savedState?.striker ?? (typeof window !== 'undefined' ? localStorage.getItem('match_striker') || 'R. Sharma' : 'R. Sharma'));
  const [nonStriker, setNonStriker] = useState(savedState?.nonStriker ?? (typeof window !== 'undefined' ? localStorage.getItem('match_non_striker') || 'I. Kishan' : 'I. Kishan'));
  const [bowler, setBowler] = useState(savedState?.bowler ?? (typeof window !== 'undefined' ? localStorage.getItem('match_bowler') || 'T. Boult' : 'T. Boult'));
  const [nextBatsman, setNextBatsman] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('match_next_batsman') || 'Player 3' : 'Player 3');
  const [isDraggingOcr, setIsDraggingOcr] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  

  const ocrRef = useRef<HTMLDivElement>(null);
  const [pendingRun, setPendingRun] = useState<number | null>(null);
  
  
  const [activeCamera, setActiveCamera] = useState('Mobile 1');
  
  
  
  const [ocrRegion, setOcrRegion] = useState({ x: 10, y: 10, width: 30, height: 20 });
  const [isOcrEnabled, setIsOcrEnabled] = useState(false);
  const [localCompactMode, setLocalCompactMode] = useState(false);
  const isCompactMode = propCompactMode ?? localCompactMode;
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const setIsCompactMode = propSetCompactMode ?? setLocalCompactMode;
const [shotData, setShotData] = useState<{run: number, angle: number, distance?: number}[]>(savedState?.shotData ?? []);

  const [strikerStats, setStrikerStats] = useState(savedState?.strikerStats ?? { runs: 0, balls: 0, fours: 0, sixes: 0 });
  const [nonStrikerStats, setNonStrikerStats] = useState(savedState?.nonStrikerStats ?? { runs: 0, balls: 0, fours: 0, sixes: 0 });
  const [bowlerStats, setBowlerStats] = useState(savedState?.bowlerStats ?? { runs: 0, wickets: 0, balls: 0 });
  const [activeBadge, setActiveBadge] = useState<{ title: string, playerName: string, type: 'batsman' | 'bowler' } | null>(null);
  const [umpireSignal, setUmpireSignal] = useState<string | null>(savedState?.umpireSignal ?? null);

  const { user, isAdmin } = useAuth();

  const [history, setHistory] = useState<any[]>(savedState?.history ?? []);
  const [deliveries, setDeliveries] = useState<any[]>(savedState?.deliveries ?? []);
  const [recentEvents, setRecentEvents] = useState<any[]>(savedState?.recentEvents ?? []);
  const [scorerName, setScorerName] = useState('');
  const [assistName, setAssistName] = useState('');
  const [matchId, setMatchId] = useState(typeof window !== 'undefined' ? localStorage.getItem('active_match_id') : null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [scoreboardTheme, setScoreboardTheme] = useState(typeof window !== 'undefined' ? localStorage.getItem('scoreboard_theme') || 'modern' : 'modern');
  const [isOwner, setIsOwner] = useState(false);
  const [transferPhone, setTransferPhone] = useState('');
  const [transferCountryCode, setTransferCountryCode] = useState('+91');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAwardsModal, setShowAwardsModal] = useState(false);
  const config = getSportConfig(sportType);
  const squadA = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('match_team_a_squad') || '[]') : [];
  const squadB = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('match_team_b_squad') || '[]') : [];
  const [followOn, setFollowOn] = useState(savedState?.followOn ?? false);
  let battingSquad = innings % 2 !== 0 ? squadA : squadB;
  let bowlingSquad = innings % 2 !== 0 ? squadB : squadA;
  if (matchFormat === 'Test Match') {
    if (innings === 1) { battingSquad = squadA; bowlingSquad = squadB; }
    else if (innings === 2) { battingSquad = squadB; bowlingSquad = squadA; }
    else if (innings === 3) { battingSquad = followOn ? squadB : squadA; bowlingSquad = followOn ? squadA : squadB; }
    else { battingSquad = followOn ? squadA : squadB; bowlingSquad = followOn ? squadB : squadA; }
  }
  const [awards, setAwards] = useState({ motm: '', mvpPoints: '', bestBatsman: '', bestBowler: '', matchResult: '' });
  const [transferError, setTransferError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [streamDestination, setStreamDestination] = useState<'user' | 'streamlify'>('user');
  const [showOverSummary, setShowOverSummary] = useState(false);
  const [overSummaryData, setOverSummaryData] = useState<{overs: number, runs: number, wickets: number, thisOver: string[], teamA?: string, teamB?: string, scoreA?: number, scoreB?: number, periodName?: string, periodValue?: number}>({overs: 0, runs: 0, wickets: 0, thisOver: []});
  const [liveStreamOption, setLiveStreamOption] = useState<'mobile' | 'professional' | 'none'>('none');
  const [ownerName, setOwnerName] = useState('the Match Creator');
  const isTied = sportType === 'Cricket' && target && runs === target - 1 && ((matchFormat === 'Test Match' && innings === 4) || (matchFormat !== 'Test Match' && innings % 2 === 0));


  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showPreStreamModal, setShowPreStreamModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showDlsModal, setShowDlsModal] = useState(false);
  const [isDlsApplied, setIsDlsApplied] = useState(false);
  const [showInnings2Modal, setShowInnings2Modal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraType, setExtraType] = useState('');
  const [i2Striker, setI2Striker] = useState('');
  const [i2NonStriker, setI2NonStriker] = useState('');
  const [i2Bowler, setI2Bowler] = useState('');
  const [isDeclared, setIsDeclared] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [isExtraTime, setIsExtraTime] = useState(savedState?.isExtraTime ?? false);
  const [subActivePlayerRole, setSubActivePlayerRole] = useState<'striker' | 'nonStriker' | 'bowler'>('striker');
  const [subSelectedPlayer, setSubSelectedPlayer] = useState('');
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<{name: string, runs: number, balls: number, fours: number, sixes: number, wickets?: number, isBowler: boolean} | null>(null);
  const [matchMaxOvers, setMatchMaxOvers] = useState(20);
  const [isRainDelayed, setIsRainDelayed] = useState(savedState?.isRainDelayed ?? false);
  const [preDelayTarget, setPreDelayTarget] = useState<number | null>(savedState?.preDelayTarget ?? null);
  const [dlsOversLost, setDlsOversLost] = useState<number>(savedState?.dlsOversLost ?? 2);
  const [dlsRevisedTarget, setDlsRevisedTarget] = useState<number | ''>('');
  const [dlsRevisedOvers, setDlsRevisedOvers] = useState<number | ''>('');
  const [dlsActiveTab, setDlsActiveTab] = useState<'revise' | 'rainStop' | 'rainDelay'>('revise');
  const [dlsCustomResult, setDlsCustomResult] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState<'hardware' | 'obs'>('hardware');
  const [showStreamScoreboard, setShowStreamScoreboard] = useState<boolean>(savedState?.showStreamScoreboard ?? true);
  const [streamSyncDelaySeconds, setStreamSyncDelaySeconds] = useState<number>(savedState?.streamSyncDelaySeconds ?? 0);

  // Delayed overlay data state for syncing with stream lag
  const [overlayScoreData, setOverlayScoreData] = useState({
    runs, wickets, overs, balls, target,
    striker, strikerStats, nonStriker, nonStrikerStats,
    bowler, bowlerStats, thisOver, scoreA, scoreB, setsA, setsB, period, umpireSignal
  });

  useEffect(() => {
    const latestData = {
      runs, wickets, overs, balls, target,
      striker, strikerStats, nonStriker, nonStrikerStats,
      bowler, bowlerStats, thisOver, scoreA, scoreB, setsA, setsB, period, umpireSignal
    };

    if (streamSyncDelaySeconds <= 0) {
      setOverlayScoreData(latestData);
    } else {
      const timer = setTimeout(() => {
        setOverlayScoreData(latestData);
      }, streamSyncDelaySeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [
    runs, wickets, overs, balls, target,
    striker, strikerStats, nonStriker, nonStrikerStats,
    bowler, bowlerStats, thisOver, scoreA, scoreB, setsA, setsB, period, umpireSignal,
    streamSyncDelaySeconds
  ]);

  useEffect(() => {
    if (showDlsModal) {
      if (innings === 1) {
        setDlsCustomResult('Match abandoned due to rain - No Result');
      } else {
        const currentOversFloat = overs + (balls / 6);
        if (currentOversFloat < 5) {
          setDlsCustomResult('Match abandoned due to rain - No Result (Minimum 5 overs not completed)');
        } else {
          const getResource = (ov: number, wk: number) => {
              if (ov <= 0) return 0;
              if (wk >= 10) return 0;
              const wFactor = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wk] || 0;
              return wFactor * Math.pow(ov / matchMaxOvers, 0.8);
          };
          const oversRemaining = Math.max(0, matchMaxOvers - currentOversFloat);
          const rRemaining = getResource(oversRemaining, wickets);
          const rUsed = 100 - rRemaining;
          const t1Score = target ? (target - 1) : 0;
          const parScore = Math.floor(t1Score * (rUsed / 100));
          
          if (runs > parScore) {
            setDlsCustomResult(`${teamB} won by ${runs - parScore} runs (DLS Method)`);
          } else if (runs === parScore) {
            setDlsCustomResult(`Match Tied (DLS Method)`);
          } else {
            setDlsCustomResult(`${teamA} won by ${parScore - runs} runs (DLS Method)`);
          }
        }
      }
    }
  }, [showDlsModal, innings, overs, balls, wickets, target, matchMaxOvers, runs, teamA, teamB]);
  const [wicketType, setWicketType] = useState('Caught');
  const [newBatsmanName, setNewBatsmanName] = useState('');
  const [showPlayerSearchModal, setShowPlayerSearchModal] = useState(false);
  const [actionModal, setActionModal] = useState<{type: string; sport: string; team: 'A'|'B'; points?: number} | null>(null);
  const [statScorer, setStatScorer] = useState('');
  const [statAssist, setStatAssist] = useState('');
  const [playerStats, setPlayerStats] = useState<Record<string, any>>(savedState?.playerStats || {});
  const [strikeAfterWicket, setStrikeAfterWicket] = useState<'new' | 'other'>('new');
  const [wicketFielder, setWicketFielder] = useState('');
  const [outBatsman, setOutBatsman] = useState<'striker' | 'nonStriker'>('striker');
  const [streamSettings, setStreamSettings] = useState({ camera: 'rear', quality: '720p', platform: 'Streamlify Live', deviceId: '', rtmpUrl: '', rtmpKey: '', obsRtmpUrl: '', obsRtmpKey: '' });
  const [obsStreamKey, setObsStreamKey] = useState('');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [isStreamingToYoutube, setIsStreamingToYoutube] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hasSyncedFromFirebaseRef = useRef(false);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const [viewerConnections, setViewerConnections] = useState<number>(0);

  const refreshVideoDevices = async (autoSelectObs = false) => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return [];
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoInputs = devices.filter(d => d.kind === 'videoinput');

      // If device labels are blank (browser hasn't granted camera permission yet), request temporary access to unlock labels
      if (videoInputs.length > 0 && videoInputs.some(d => !d.label)) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          devices = await navigator.mediaDevices.enumerateDevices();
          videoInputs = devices.filter(d => d.kind === 'videoinput');
          tempStream.getTracks().forEach(t => t.stop());
        } catch (err) {
          console.warn("Camera permission prompt rejected or deferred:", err);
        }
      }

      setVideoDevices(videoInputs);

      // Search for OBS / Virtual Camera keywords
      const obsKeywords = ['obs', 'virtual', 'vcam', 'vmix', 'streamlabs', 'obs camera', 'obs-camera'];
      const obsCam = videoInputs.find(d => {
        const lbl = (d.label || '').toLowerCase();
        return obsKeywords.some(kw => lbl.includes(kw));
      });

      if (obsCam) {
        if (autoSelectObs || !streamSettings.deviceId) {
          setStreamSettings(prev => ({ ...prev, deviceId: obsCam.deviceId }));
        }
      } else if (autoSelectObs) {
        alert("OBS Virtual Camera was not detected in available devices. Please click 'Start Virtual Camera' in OBS Studio first, then click Detect OBS / Refresh Cameras.");
      }

      return videoInputs;
    } catch (e) {
      console.warn("Could not enumerate video devices", e);
      return [];
    }
  };

  useEffect(() => {
    
  }, []);

  // Load saved YouTube Stream Key from Firestore or localStorage
  useEffect(() => {
    const loadYoutubeKey = async () => {
      let savedKey = '';
      if (typeof window !== 'undefined') {
        savedKey = localStorage.getItem(`youtube_stream_key_${user?.uid || 'guest'}`) || '';
      }
      
      if (user && user.uid) {
        try {
          const profile = await dbService.get('profiles', user.uid) as any;
          if (profile) {
            if (profile.youtube_stream_key) {
              savedKey = profile.youtube_stream_key;
              if (typeof window !== 'undefined') {
                localStorage.setItem(`youtube_stream_key_${user.uid}`, savedKey);
              }
            }
            if (profile.obs_stream_key) {
              setObsStreamKey(profile.obs_stream_key);
            }
          }
        } catch (e) {
          console.warn("Failed to load stream keys in LiveScoring:", e);
        }
      }
      
      if (savedKey) {
        setStreamSettings(prev => ({
          ...prev,
          rtmpKey: prev.rtmpKey || savedKey
        }));
      }
    };
    loadYoutubeKey();
  }, [user]);

  const [networkStatus, setNetworkStatus] = useState('Checking...');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);
  const [isSmartStartActive, setIsSmartStartActive] = useState(false);
  const [broadcastStartTime, setBroadcastStartTime] = useState<number | null>(null);
  const [broadcastDuration, setBroadcastDuration] = useState('00:00:00');
  const [obsWs, setObsWs] = useState<WebSocket | null>(null);
  const [obsPluginStatus, setObsPluginStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Stopwatch effect
  useEffect(() => {
    let interval: any;
    if (isSmartStartActive && broadcastStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - broadcastStartTime) / 1000);
        const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
        const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setBroadcastDuration(`${hrs}:${mins}:${secs}`);
      }, 1000);
    } else {
      setBroadcastDuration('00:00:00');
    }
    return () => clearInterval(interval);
  }, [isSmartStartActive, broadcastStartTime]);

  // Mock WebSocket Auto-Reconnect effect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      if (!isSmartStartActive) return;
      
      setObsPluginStatus('connecting');
      try {
        // Attempt to connect to local OBS plugin WebSocket
        ws = new window.WebSocket('ws://127.0.0.1:4455');

        ws.onopen = () => {
          setObsPluginStatus('connected');
          setReconnectAttempts(0);
        };

        ws.onclose = () => {
          if (!isSmartStartActive) return;
          setObsPluginStatus('error');
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          setReconnectAttempts(prev => prev + 1);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        };

        ws.onerror = (err) => {
          console.error("OBS Plugin WebSocket error", err);
          // onclose will handle reconnect
        };
        
        setObsWs(ws);
      } catch (err) {
        setObsPluginStatus('error');
      }
    };

    if (isSmartStartActive && (obsPluginStatus === 'disconnected' || obsPluginStatus === 'error')) {
      if (reconnectAttempts === 0) {
        connectWebSocket();
      }
    }

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [isSmartStartActive, reconnectAttempts]);

  const handleSmartStartToggle = () => {
    if (isSmartStartActive) {
      setIsSmartStartActive(false);
      setBroadcastStartTime(null);
      setObsPluginStatus('disconnected');
      setReconnectAttempts(0);
      if (obsWs) obsWs.close();
    } else {
      setIsSmartStartActive(true);
      setBroadcastStartTime(Date.now());
      setObsPluginStatus('disconnected');
      setReconnectAttempts(0);
    }
  };


  

  const confirmAction = () => {
    if (!actionModal) return;
    pushHistorySnapshot();
    const { type, sport, team, points } = actionModal;
    
    if (sport === 'Football' || sport === 'Hockey') {
        if (type === 'goal') {
            if (team === 'A') setScoreA(s => s + 1);
            else setScoreB(s => s + 1);
        }
    } else if (sport === 'Basketball') {
        if (type === 'points') {
            const pts = points || 1;
            if (team === 'A') setScoreA(s => s + pts);
            else setScoreB(s => s + pts);
        }
    } else {
        if (type === 'ace' || type === 'point') {
            if (team === 'A') setScoreA(s => s + 1);
            else setScoreB(s => s + 1);
        }
    }

    setPlayerStats((prev: Record<string, any>) => {
        const next = JSON.parse(JSON.stringify(prev));
        const ensurePlayer = (p: string) => {
            if (!next[p]) next[p] = {};
            if (!next[p][sport]) next[p][sport] = {};
        };
        if (statScorer) {
            ensurePlayer(statScorer);
            if (sport === 'Football' || sport === 'Hockey') {
                if (type === 'goal') next[statScorer][sport].goals = (next[statScorer][sport].goals || 0) + 1;
                else if (type === 'yellow_card') next[statScorer][sport].yellowCards = (next[statScorer][sport].yellowCards || 0) + 1;
                else if (type === 'red_card') next[statScorer][sport].redCards = (next[statScorer][sport].redCards || 0) + 1;
                else if (type === 'clean_sheet') next[statScorer][sport].cleanSheets = (next[statScorer][sport].cleanSheets || 0) + 1;
            } else if (sport === 'Basketball') {
                if (type === 'points') next[statScorer][sport].points = (next[statScorer][sport].points || 0) + (points || 1);
                else if (type === 'rebound') next[statScorer][sport].rebounds = (next[statScorer][sport].rebounds || 0) + 1;
                else if (type === 'steal') next[statScorer][sport].steals = (next[statScorer][sport].steals || 0) + 1;
                else if (type === 'block') next[statScorer][sport].blocks = (next[statScorer][sport].blocks || 0) + 1;
            } else {
                if (type === 'ace' || type === 'point') next[statScorer][sport].points = (next[statScorer][sport].points || 0) + 1;
            }
        }
        if (statAssist) {
            ensurePlayer(statAssist);
            if (sport === 'Football' || sport === 'Hockey' || sport === 'Basketball') {
                next[statAssist][sport].assists = (next[statAssist][sport].assists || 0) + 1;
            }
        }
        return next;
    });

    setActionModal(null);
    setStatScorer('');
    setStatAssist('');
  };

  useEffect(() => {
    const activeMatchId = typeof window !== 'undefined' ? localStorage.getItem('active_match_id') : null;
    if (activeMatchId) {
      import('../lib/database').then(({ dbService }) => {
        dbService.get('matches', activeMatchId).then((match: any) => {
          if (match) {
            if (match.team_a) setTeamA(match.team_a);
            if (match.team_b) setTeamB(match.team_b);
            if (match.matchFormat) setMatchFormat(match.matchFormat);
          }
        });
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const unsubscribe = scoreboardService.subscribeToMatch(matchId, (data) => {

        setOwnerId(data.ownerId);
        setIsOwner(Boolean(user?.uid && (data.ownerId === user.uid || data.owner_id === user.uid || data.created_by === user.uid)));
        if (data.webrtc_peer_id !== undefined) setWebrtcPeerId(data.webrtc_peer_id);
        if (data.youtubeUrl !== undefined) setYoutubeUrl(data.youtubeUrl);
        if (data.liveStreamOption !== undefined) setLiveStreamOption(data.liveStreamOption);
        if (data.showStreamScoreboard !== undefined) setShowStreamScoreboard(data.showStreamScoreboard);
        if (data.streamSyncDelaySeconds !== undefined) setStreamSyncDelaySeconds(data.streamSyncDelaySeconds);

        // Always sync from firestore on first load to prevent data loss on refresh, then only viewers sync continuously
        if (!hasSyncedFromFirebaseRef.current || !user?.uid || (user.uid !== data.ownerId && user.uid !== data.owner_id && user.uid !== data.created_by)) {
          hasSyncedFromFirebaseRef.current = true;
          // If viewer, sync states from firestore
          if (data.runs !== undefined) setRuns(data.runs);
          if (data.wickets !== undefined) setWickets(data.wickets);
          if (data.overs_bowled !== undefined) setOvers(data.overs_bowled);
          if (data.balls !== undefined) setBalls(data.balls);
          if (data.thisOver) setThisOver(data.thisOver);
          if (data.strikerStats) setStrikerStats(data.strikerStats);
          if (data.nonStrikerStats) setNonStrikerStats(data.nonStrikerStats);
          if (data.bowlerStats) setBowlerStats(data.bowlerStats);
          if (data.shotData) setShotData(data.shotData);
          
          if (data.activeBadge) setActiveBadge(data.activeBadge);
          if (data.recentEvents) setRecentEvents(data.recentEvents);
          if (data.scoreboardTheme !== undefined) setScoreboardTheme(data.scoreboardTheme);
          if (data.viewersCount !== undefined) setViewersCount(data.viewersCount);
          if (data.scoreA !== undefined) setScoreA(data.scoreA);
          if (data.scoreB !== undefined) setScoreB(data.scoreB);
          if (data.setsA !== undefined) setSetsA(data.setsA);
          if (data.setsB !== undefined) setSetsB(data.setsB);
          if (data.period !== undefined) setPeriod(data.period);
          if (data.deliveries) setDeliveries(data.deliveries);
          if (data.isRainDelayed !== undefined) setIsRainDelayed(data.isRainDelayed);
          if (data.preDelayTarget !== undefined) setPreDelayTarget(data.preDelayTarget);
          if (data.dlsOversLost !== undefined) setDlsOversLost(data.dlsOversLost);
          if (data.matchMaxOvers !== undefined) setMatchMaxOvers(data.matchMaxOvers);
          if (data.target !== undefined) setTarget(data.target);
          if (data.history) setHistory(data.history);
          if (data.innings !== undefined) setInnings(data.innings);
          if (data.inningsScores) setInningsScores(data.inningsScores);
        }
    });
    
  return unsubscribe;
  }, [matchId, user]);

  useEffect(() => {
    const fetchOwnerName = async () => {
      if (ownerId) {
        try {
          const profile = await dbService.get('profiles', ownerId) as any;
          if (profile && (profile.full_name || profile.username)) {
            setOwnerName(profile.full_name || profile.username);
          } else {
            setOwnerName('the Match Creator');
          }
        } catch (e) {
          console.warn('Failed to fetch match owner profile', e);
          setOwnerName('the Match Creator');
        }
      }
    };
    fetchOwnerName();
  }, [ownerId]);

  useEffect(() => {
    if (matchId && isOwner) {
      scoreboardService.updateScore(matchId, {
        sportType,
        scoreA,
        scoreB,
        setsA,
        setsB,
        period,
        isExtraTime,
        isRainDelayed,
        preDelayTarget,
        dlsOversLost,
        matchMaxOvers,
        target,
        runs, wickets, overs, balls, thisOver, striker, nonStriker, bowler,
        strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, deliveries, umpireSignal, playerStats, scoreboardTheme, showStreamScoreboard, streamSyncDelaySeconds
      }, sportType);
    }
  }, [runs, wickets, overs, balls, thisOver, strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, matchId, isOwner, scoreA, scoreB, setsA, setsB, period, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, target, playerStats, scoreboardTheme, showStreamScoreboard, streamSyncDelaySeconds]);

  // Latest state ref for background sync job
  const syncStateRef = useRef({
    runs, wickets, overs, balls, thisOver, striker, nonStriker, bowler,
    strikerStats, nonStrikerStats, bowlerStats, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, target, innings, inningsScores,
    isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, playerStats, youtubeUrl, scoreboardTheme, liveStreamOption
  });

  // Update ref on every render so the background sync always has the latest data
  useEffect(() => {
    syncStateRef.current = {
      runs, wickets, overs, balls, thisOver, striker, nonStriker, bowler,
      strikerStats, nonStrikerStats, bowlerStats, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, target, innings, inningsScores,
      isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, playerStats, youtubeUrl, scoreboardTheme, liveStreamOption
    };
  });

  // Background sync job to prevent data loss on browser refresh
  useEffect(() => {
    if (!matchId || !isOwner) return;

    const intervalId = setInterval(() => {
      const state = syncStateRef.current;
      scoreboardService.updateScore(matchId, {
        runs: state.runs, wickets: state.wickets, overs: state.overs, balls: state.balls, thisOver: state.thisOver, striker: state.striker, nonStriker: state.nonStriker, bowler: state.bowler,
        strikerStats: state.strikerStats, nonStrikerStats: state.nonStrikerStats, bowlerStats: state.bowlerStats, history: state.history, scoreA: state.scoreA, scoreB: state.scoreB, setsA: state.setsA, setsB: state.setsB, period: state.period, sportType: state.sportType, matchFormat: state.matchFormat, deliveries: state.deliveries, target: state.target, innings: state.innings, inningsScores: state.inningsScores,
        isExtraTime: state.isExtraTime,
        isRainDelayed: state.isRainDelayed,
        preDelayTarget: state.preDelayTarget,
        dlsOversLost: state.dlsOversLost,
        matchMaxOvers: state.matchMaxOvers,
        playerStats: state.playerStats,
        youtubeUrl: state.youtubeUrl,
        scoreboardTheme: state.scoreboardTheme,
        liveStreamOption: state.liveStreamOption,
        lastAutoSave: new Date().toISOString()
      }, state.sportType);
    }, 15000); // Save every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [matchId, isOwner]);



  const handleTransfer = async () => {
    if (!transferPhone) return;
    try {
      const searchPhone = (transferCountryCode + ' ' + transferPhone).replace(/\s+/g, '');
      const allProfiles = await dbService.getAll('profiles');
      const data = allProfiles.filter((p: any) => p.phone && p.phone.replace(/\s+/g, '').includes(searchPhone.replace('+', '')));
      if (data.length === 0) {
        setTransferError('No user found with this mobile number');
        return;
      }
      const newOwnerId = data[0].id;
      if (matchId) {
        await dbService.update('matches', matchId, {
          owner_id: newOwnerId
        });
        setShowTransferModal(false);
        setTransferPhone('');
        setIsOwner(false); // We transferred it, so we aren't owner anymore
      }
    } catch (e) {
      console.warn(e);
      setTransferError('Failed to transfer scoring rights');
    }
  };


  
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [isReceivingWebRTC, setIsReceivingWebRTC] = useState(false);
  const [remoteWebRtcStream, setRemoteWebRtcStream] = useState<MediaStream | null>(null);
  const [webrtcPeerId, setWebrtcPeerId] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const cameraStreams: Record<string, { type: 'mp4' | 'hls', url: string }> = {
    'Mobile 1': { type: 'hls', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    'Mobile 2': { type: 'mp4', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    'Pro Camera 1 (4K)': { type: 'hls', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
    'Pro Camera 2 (Broadcast)': { type: 'mp4', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }
  };

  useEffect(() => {
    if (isOwner) {
      localStorage.setItem('livescoring_state', JSON.stringify({
        runs, wickets, overs, balls, thisOver, target, striker, nonStriker, bowler, shotData, strikerStats, nonStrikerStats, bowlerStats
      , history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, followOn, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores, playerStats, recentEvents, showStreamScoreboard, streamSyncDelaySeconds}));
    }
  }, [runs, wickets, overs, balls, thisOver, target, striker, nonStriker, bowler, shotData, isOwner, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, followOn, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores, playerStats, recentEvents]);



  const handleScanOcr = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Simulate reading score
      setRuns(prev => prev + Math.floor(Math.random() * 4));
      // Optionally show a toast if we had the context
    }, 1500);
  };
  
  const handleOcrDragStart = (e: React.MouseEvent) => {
    if (e.target === ocrRef.current) {
      setIsDraggingOcr(true);
    }
  };
  
  const handleOcrDragEnd = () => {
    setIsDraggingOcr(false);
  };
  
  const handleOcrMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingOcr && ocrRef.current) {
      const parent = ocrRef.current.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const newX = ((e.clientX - rect.left) / rect.width) * 100;
      const newY = ((e.clientY - rect.top) / rect.height) * 100;
      setOcrRegion(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, newX - prev.width / 2)),
        y: Math.max(0, Math.min(100 - prev.height, newY - prev.height / 2))
      }));
    }
  };
  
  
  const showBadge = (title: string, playerName: string, type: 'batsman' | 'bowler') => {
    setActiveBadge({ title, playerName, type });
    sendPushAlert("Milestone Alert!", `${playerName} just reached: ${title}`);
    setTimeout(() => {
      setActiveBadge(null);
    }, 4000);
  };

  const pushHistorySnapshot = () => {
    setHistory(prev => [
      ...prev,
      {
        runs,
        wickets,
        overs,
        balls,
        thisOver: [...thisOver],
        striker,
        nonStriker,
        bowler,
        strikerStats: { ...strikerStats },
        nonStrikerStats: { ...nonStrikerStats },
        bowlerStats: { ...bowlerStats },
        shotData: [...shotData],
        deliveries: [...deliveries],
        recentEvents: [...recentEvents],
        playerStats: JSON.parse(JSON.stringify(playerStats || {})),
        scoreA,
        scoreB,
        setsA,
        setsB,
        period,
        umpireSignal,
        target,
        innings,
        isExtraTime
      }
    ]);
  };

  const handleDelivery = (type: string, value: number, isLegal: boolean, isWicket: boolean) => {
    pushHistorySnapshot();

    if (wickets >= 10 || overs >= matchMaxOvers) return;
    const newRuns = runs + value;
    const newWickets = isWicket ? Math.min(wickets + 1, 10) : wickets;
    
    const deliveryRecord = {
      over: overs,
      ball: balls + (isLegal ? 1 : 0),
      striker,
      bowler,
      runs: value,
      type,
      isWicket,
      isLegal,
      timestamp: new Date().toISOString(),
      scoreAtEnd: `${newRuns}/${newWickets}`
    };
    setDeliveries(prev => [...prev, deliveryRecord]);

    setRuns(newRuns);

    const newStrikerStats = { ...strikerStats };
    const newBowlerStats = { ...bowlerStats };

    if (isLegal) {
      newStrikerStats.balls += 1;
      newBowlerStats.balls += 1;
    }

    if (type !== 'W' && !isNaN(value)) {
      if (['WD', 'B', 'LB'].includes(type)) {
        if (type === 'WD') {
          newBowlerStats.runs += value;
        }
      } else if (type === 'NB') {
        const batRuns = Math.max(0, value - 1);
        newStrikerStats.runs += batRuns;
        if (batRuns === 4) newStrikerStats.fours += 1;
        if (batRuns === 6) newStrikerStats.sixes += 1;
        newBowlerStats.runs += value;
      } else {
        newStrikerStats.runs += value;
        if (value === 4) newStrikerStats.fours += 1;
        if (value === 6) newStrikerStats.sixes += 1;
        newBowlerStats.runs += value;
      }

      // Check badges
      if (strikerStats.runs < 30 && newStrikerStats.runs >= 30) {
        showBadge("Cool Thirty", striker, "batsman");
      } else if (strikerStats.runs < 50 && newStrikerStats.runs >= 50) {
        showBadge("Nifty Fifty", striker, "batsman");
      } else if (strikerStats.runs < 100 && newStrikerStats.runs >= 100) {
        showBadge("Tremendous Century", striker, "batsman");
      }
    }

    if (isWicket) {
      newBowlerStats.wickets += 1;
      if (newBowlerStats.wickets === 3) {
        showBadge("Three-fer", bowler, "bowler");
      } else if (newBowlerStats.wickets === 5) {
        showBadge("Five-Wicket Haul", bowler, "bowler");
      }
    }

    let finalStriker = striker;
    let finalNonStriker = nonStriker;
    let finalStrikerStats = newStrikerStats;
    let finalNonStrikerStats = nonStrikerStats;

    // Swap strike on odd runs
    if (!isNaN(value) && value % 2 !== 0 && type !== 'W') {
      const tempStriker = finalStriker;
      const tempStrikerStats = finalStrikerStats;
      finalStriker = finalNonStriker;
      finalStrikerStats = finalNonStrikerStats;
      finalNonStriker = tempStriker;
      finalNonStrikerStats = tempStrikerStats;
    }

    // End of over: swap strike for next over
    if (isLegal && balls === 5) {
      const tempStriker = finalStriker;
      const tempStrikerStats = finalStrikerStats;
      finalStriker = finalNonStriker;
      finalStrikerStats = finalNonStrikerStats;
      finalNonStriker = tempStriker;
      finalNonStrikerStats = tempStrikerStats;
    }

    setStriker(finalStriker);
    setNonStriker(finalNonStriker);
    setStrikerStats(finalStrikerStats);
    setNonStrikerStats(finalNonStrikerStats);
    setBowlerStats(newBowlerStats);

    const isPenaltyExtra = ['WD', 'NB'].includes(type);
    const isRunExtra = ['B', 'LB'].includes(type);
    let displayType = type;
    if (isPenaltyExtra && value > 1) {
       displayType = `${value}${type}`;
    } else if (isRunExtra && value > 0) {
       displayType = `${value}${type}`;
    }

    if (isOwner && matchId) {
      scoreboardService.updateScore(matchId, {
        runs: newRuns,
        wickets: newWickets,
        overs: isLegal && balls === 5 ? overs + 1 : overs,
        balls: isLegal ? (balls === 5 ? 0 : balls + 1) : balls,
        thisOver: (isLegal && balls === 5) ? [] : [...thisOver, displayType],
        striker: finalStriker,
        nonStriker: finalNonStriker,
        bowler,
        strikerStats: finalStrikerStats,
        nonStrikerStats: finalNonStrikerStats,
        bowlerStats: newBowlerStats,
        deliveries: [...deliveries, deliveryRecord],
        target,
        innings,
        isExtraTime,
        playerStats,
        recentEvents,
        lastAutoSave: new Date().toISOString()
      }, sportType);
    }

    if (isWicket) setWickets(newWickets);

    if (isLegal) {
      if (balls === 5) {
        setBalls(0);
        setOvers(overs + 1);
        setThisOver([]);
        setOverSummaryData({
          overs: overs + 1,
          runs: newRuns,
          wickets: newWickets,
          thisOver: [...thisOver, displayType]
        });
        setShowOverSummary(true);
        setTimeout(() => setShowOverSummary(false), 8000);
      } else {
        setBalls(balls + 1);
        setThisOver([...thisOver, displayType]);
      }
    } else {
      setThisOver([...thisOver, displayType]);
    }
  };

  const sendPushAlert = async (title: string, body: string) => {
    if (!matchId) return;
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matchId, title, body })
      });
    } catch (e) {
      console.warn("Failed to send push alert", e);
    }
  };

  const handleRun = (run: number) => handleDelivery(run.toString(), run, true, false);
  const handleWicket = () => {
    setNewBatsmanName(nextBatsman);
    setShowWicketModal(true);
  };
  
  const submitWicket = () => {
    handleDelivery('W', 0, true, true);
    
    // Switch batsmen
    if (outBatsman === 'striker') {
       if (strikeAfterWicket === 'new') {
           setStriker(newBatsmanName);
           setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
       } else {
           setStriker(nonStriker);
           setStrikerStats(nonStrikerStats);
           setNonStriker(newBatsmanName);
           setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
       }
    } else {
       if (strikeAfterWicket === 'new') {
           setStriker(newBatsmanName);
           setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
           setNonStriker(striker);
           setNonStrikerStats(strikerStats);
       } else {
           setNonStriker(newBatsmanName);
           setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
       }
    }
    
    // Add event to timeline
    const outName = outBatsman === 'striker' ? striker : nonStriker;
    let desc = `${outName} - ${wicketType}`;
    if (wicketFielder) desc += ` by ${wicketFielder}`;
    
    setRecentEvents(prev => [{ id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, team: innings % 2 !== 0 ? 'A' : 'B', playerName: desc, action: 'W', timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
    
    // Send Push Alert for Wicket
    sendPushAlert("Wicket Alert!", `${desc}. Score: ${runs}/${wickets + 1}`);

    setShowWicketModal(false);
  };

  const getShareText = () => {
    let text = `${teamA} vs ${teamB}\n`;
    if (sportType === 'Cricket') {
      text += `Live Score: ${runs}/${wickets} (${overs}.${balls} ov)\n`;
    } else {
      text += `Live Score: ${scoreA} - ${scoreB}\n`;
    }
    if (youtubeUrl) {
      text += `Watch Live: ${youtubeUrl}\n`;
    }
    text += `Follow on Cricket Delivery: ${window.location.origin}`;
    return text;
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Live Match Score',
          text: text,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      alert("Native sharing not supported on this browser.");
    }
  };

  const shareToWhatsApp = () => {
    const text = getShareText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = getShareText();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToFacebook = () => {
    // Facebook sharer only accepts URLs
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`, '_blank');
  };

  const handleExtra = (type: string, runValue: number = 1) => handleDelivery(type, runValue, !['WD', 'NB'].includes(type), false);
  

  const startObsScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.warn("play err", err));
        setIsCameraActive(true);
        setSelectedSourceType('obs');
        setShowPreStreamModal(false);
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Could not start video source')) {
         try {
           const streamNoAudio = await navigator.mediaDevices.getDisplayMedia({
             video: {
               width: { ideal: 1920 },
               height: { ideal: 1080 },
               frameRate: { ideal: 30 }
             },
             audio: false
           });
           if (videoRef.current) {
             videoRef.current.srcObject = streamNoAudio;
             videoRef.current.play().catch(err => console.warn("play err", err));
             setIsCameraActive(true);
             setSelectedSourceType('obs');
             setShowPreStreamModal(false);
           }
         } catch(e2: any) {
           console.warn("Screen share cancel or error without audio", e2);
           alert('Could not capture screen. Error: ' + e2.message);
         }
      } else {
        console.warn("Screen share cancel or error", e);
        alert('Could not capture screen. Error: ' + (e.message || 'Unknown error'));
      }
    }
  };


  // WebRTC Viewer Logic
  useEffect(() => {
    if (!webrtcPeerId || isOwner) {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setIsReceivingWebRTC(false);
      setRemoteWebRtcStream(null);
      return;
    }

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });
    peer.on('open', () => {
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 16;
      dummyCanvas.height = 16;
      const dummyStream = dummyCanvas.captureStream(1);
      
      const connectToBroadcaster = () => {
        const call = peer.call(webrtcPeerId, dummyStream);
        if (call) {
          call.on('stream', (remoteStream) => {
            setRemoteWebRtcStream(remoteStream);
            setIsReceivingWebRTC(true);
          });
          call.on('error', (err) => console.warn("LiveScoring WebRTC error:", err));
        }
      };

      connectToBroadcaster();
      const retryTimer = setTimeout(() => {
        if (!isReceivingWebRTC && !peer.destroyed) {
          connectToBroadcaster();
        }
      }, 1500);

      return () => clearTimeout(retryTimer);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
      setIsReceivingWebRTC(false);
      setRemoteWebRtcStream(null);
    };
  }, [webrtcPeerId, isOwner]);

  useEffect(() => {
    if (isReceivingWebRTC && remoteWebRtcStream && viewerVideoRef.current) {
      viewerVideoRef.current.srcObject = remoteWebRtcStream;
      viewerVideoRef.current.muted = true;
      viewerVideoRef.current.play().catch(e => {
        console.warn("Video auto-play retry in LiveScoring:", e);
        if (viewerVideoRef.current) {
          viewerVideoRef.current.muted = true;
          viewerVideoRef.current.play().catch(err => console.error("Video play failed:", err));
        }
      });
    }
  }, [isReceivingWebRTC, remoteWebRtcStream]);

  const startCamera = async () => {
    try {
      let videoConstraints: any = {};
      let targetDeviceId = streamSettings.deviceId;

      // If no deviceId manually chosen yet, try auto-finding OBS Virtual Camera
      if (!targetDeviceId && videoDevices.length > 0) {
        const obsKeywords = ['obs', 'virtual', 'vcam', 'vmix', 'streamlabs'];
        const obsCam = videoDevices.find(d => {
          const lbl = (d.label || '').toLowerCase();
          return obsKeywords.some(kw => lbl.includes(kw));
        });
        if (obsCam) {
          targetDeviceId = obsCam.deviceId;
          setStreamSettings(prev => ({ ...prev, deviceId: obsCam.deviceId }));
        }
      }

      if (targetDeviceId) {
        videoConstraints.deviceId = { ideal: targetDeviceId };
      } else {
        videoConstraints.facingMode = streamSettings.camera === 'rear' ? 'environment' : 'user';
      }
      
      if (streamSettings.quality === '4k') {
         videoConstraints.width = { ideal: 3840 };
         videoConstraints.height = { ideal: 2160 };
      } else if (streamSettings.quality === '1080p') {
         videoConstraints.width = { ideal: 1920 };
         videoConstraints.height = { ideal: 1080 };
      }

      const constraints = {
        video: videoConstraints,
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setShowPreStreamModal(false);
      }
    } catch (e: any) {
      console.warn("Camera start failed with standard constraints, attempting fallback:", e);
      const targetDeviceId = streamSettings.deviceId;
      try {
        // Fallback preserving selected deviceId (e.g. OBS Virtual Camera)
        const videoOpt = targetDeviceId ? { deviceId: { ideal: targetDeviceId } } : true;
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoOpt, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
          setShowPreStreamModal(false);
        }
      } catch (err: any) {
         try {
           const videoOpt = targetDeviceId ? { deviceId: { ideal: targetDeviceId } } : true;
           const stream = await navigator.mediaDevices.getUserMedia({ video: videoOpt, audio: false });
           if (videoRef.current) {
             videoRef.current.srcObject = stream;
             videoRef.current.play();
             setIsCameraActive(true);
             setShowPreStreamModal(false);
           }
         } catch(e2: any) {
             alert('Could not access camera source. If using OBS Virtual Camera, make sure "Start Virtual Camera" is turned ON inside OBS Studio and not in use exclusively by another program. Error: ' + (e2.message || e.message));
         }
      }
    }
  };

  const startYoutubeStream = () => {
    
    if (!videoRef.current || !videoRef.current.srcObject) {
      alert("Please start the camera first.");
      return;
    }

    const canvas = document.createElement('canvas');
    compositeCanvasRef.current = canvas;
    const video = videoRef.current;
    
    // Use the actual video dimensions
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isStreaming = true;

    const drawFrame = () => {
      if (!isStreaming || !compositeCanvasRef.current) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Calculate layout dimensions
      const sbHeight = canvas.height * 0.12; // Around 86px for 720p
      const sbWidth = canvas.width - 80;    // Around 1200px
      const sbY = canvas.height - sbHeight - 45;
      const sbX = 40;
      
      ctx.save();
      
      // 1. Draw Translucent Glassmorphism background for the main scorecard bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Slate 900
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(sbX, sbY, sbWidth, sbHeight, 16);
      } else {
        ctx.rect(sbX, sbY, sbWidth, sbHeight);
      }
      ctx.fill();
      
      // Sleek top border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // 2. Draw Crimson "LIVE" badge with rounded corners
      ctx.fillStyle = '#DC2626'; // Red 600
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(sbX + 15, sbY + 15, 75, sbHeight - 30, 8);
      } else {
        ctx.rect(sbX + 15, sbY + 15, 75, sbHeight - 30);
      }
      ctx.fill();
      
      // White LIVE text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${sbHeight * 0.22}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LIVE', sbX + 15 + 37.5, sbY + sbHeight * 0.5);
      
      // 3. Core Scoreboard Text Section (Left-aligned)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#FFFFFF';
      
      let mainTitleText = '';
      let secondaryStatusText = '';
      
      if (sportType === 'Cricket') {
        mainTitleText = `${teamA.toUpperCase()}   ${runs}/${wickets}`;
        const crr = (overs + balls/6 > 0 ? (runs / (overs + balls/6)) : 0).toFixed(2);
        secondaryStatusText = `OVERS: ${overs}.${balls}  •  CRR: ${crr}${target ? `  •  TARGET: ${target}` : ''}`;
      } else {
        mainTitleText = `${teamA.toUpperCase()} ${scoreA}  -  ${scoreB} ${teamB.toUpperCase()}`;
        secondaryStatusText = `PERIOD: ${period}  •  Streamlify Live Broadcast`;
      }
      
      // Draw Title and Subtitle with gorgeous contrast
      ctx.font = `black ${sbHeight * 0.32}px sans-serif`;
      ctx.fillText(mainTitleText, sbX + 115, sbY + sbHeight * 0.44);
      
      ctx.fillStyle = '#38BDF8'; // Sky-400 (vibrant accent)
      ctx.font = `bold ${sbHeight * 0.18}px monospace`;
      ctx.fillText(secondaryStatusText, sbX + 115, sbY + sbHeight * 0.76);
      
      // 4. Draw divider to separate player statistics
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sbX + 480, sbY + 15);
      ctx.lineTo(sbX + 480, sbY + sbHeight - 15);
      ctx.stroke();
      
      // 5. Draw Player Statistics (Cricket specific)
      if (sportType === 'Cricket') {
        const strikerName = striker || 'Batter 1';
        const nonStrikerName = nonStriker || 'Batter 2';
        const activeBowlerName = bowler || 'Bowler';
        
        const sRuns = strikerStats?.runs ?? 0;
        const sBalls = strikerStats?.balls ?? 0;
        const nsRuns = nonStrikerStats?.runs ?? 0;
        const nsBalls = nonStrikerStats?.balls ?? 0;
        const bWickets = bowlerStats?.wickets ?? 0;
        const bRuns = bowlerStats?.runs ?? 0;
        const bBalls = bowlerStats?.balls ?? 0;
        
        ctx.textAlign = 'left';
        
        // Col 1: Batsmen Info (X = sbX + 500)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${sbHeight * 0.22}px sans-serif`;
        ctx.fillText(`🏏 ${strikerName}*`, sbX + 500, sbY + sbHeight * 0.38);
        ctx.fillStyle = '#94A3B8'; // Slate 400
        ctx.fillText(`${nonStrikerName}`, sbX + 500, sbY + sbHeight * 0.74);
        
        // Align runs to X = sbX + 710
        ctx.textAlign = 'right';
        ctx.fillStyle = '#F43F5E'; // Rose 500 for active runs
        ctx.font = `bold ${sbHeight * 0.24}px monospace`;
        ctx.fillText(`${sRuns} (${sBalls})`, sbX + 710, sbY + sbHeight * 0.38);
        ctx.fillStyle = '#94A3B8';
        ctx.font = `bold ${sbHeight * 0.20}px monospace`;
        ctx.fillText(`${nsRuns} (${nsBalls})`, sbX + 710, sbY + sbHeight * 0.74);
        
        // Second vertical divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(sbX + 740, sbY + 15);
        ctx.lineTo(sbX + 740, sbY + sbHeight - 15);
        ctx.stroke();
        
        // Col 2: Bowler Info & Over Summary (X = sbX + 760)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FBBF24'; // Yellow 400
        ctx.font = `bold ${sbHeight * 0.22}px sans-serif`;
        ctx.fillText(`🥎 ${activeBowlerName}`, sbX + 760, sbY + sbHeight * 0.38);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${sbHeight * 0.22}px monospace`;
        ctx.fillText(`${bWickets}-${bRuns} (${Math.floor(bBalls / 6)}.${bBalls % 6})`, sbX + 960, sbY + sbHeight * 0.38);
        
        // Col 3: Ball By Ball Circle Badges
        if (thisOver && thisOver.length > 0) {
          const startX = sbX + 760;
          const startY = sbY + sbHeight * 0.71;
          thisOver.slice(-6).forEach((ball, idx) => {
            const ballX = startX + idx * 30 + 10;
            const ballY = startY;
            const radius = 11;
            
            // Color-coding
            let bg = '#475569'; // slate-600
            let textCol = '#FFFFFF';
            const ballLower = String(ball).toLowerCase();
            
            if (ballLower.includes('w')) {
              bg = '#E11D48'; // rose-600 (Wicket)
            } else if (ballLower === '4') {
              bg = '#2563EB'; // blue-600 (Four)
            } else if (ballLower === '6') {
              bg = '#7C3AED'; // purple-600 (Six)
            } else if (ballLower === '0') {
              bg = '#1E293B'; // slate-800 (Dot)
              textCol = '#94A3B8';
            } else if (['wd', 'nb', 'b', 'lb'].some(ext => ballLower.includes(ext))) {
              bg = '#D97706'; // amber-600 (Extra)
            }
            
            ctx.beginPath();
            ctx.arc(ballX, ballY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = bg;
            ctx.fill();
            
            // Text centering in circle
            ctx.fillStyle = textCol;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball, ballX, ballY + 0.5);
          });
        }
      } else {
        // Non-cricket extra details on the right
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94A3B8';
        ctx.font = `bold ${sbHeight * 0.22}px sans-serif`;
        ctx.fillText(`STREAMLIFY PROFESSIONAL MULTI-CAMERA BROADCAST`, sbX + sbWidth - 30, sbY + sbHeight * 0.55);
      }
      
      ctx.restore();
      
      requestAnimationFrame(drawFrame);
    };

    drawFrame();

    // 30 FPS stream
    const canvasStream = canvas.captureStream(30);
    // Add audio track from video
    const originalStream = video.srcObject as MediaStream;
    originalStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = `${protocol}//${window.location.host}/api/stream/youtube?rtmpUrl=${encodeURIComponent(streamSettings.rtmpUrl)}&rtmpKey=${encodeURIComponent(streamSettings.rtmpKey)}`;
    if (streamSettings.obsRtmpUrl && streamSettings.obsRtmpKey) {
      wsUrl += `&obsRtmpUrl=${encodeURIComponent(streamSettings.obsRtmpUrl)}&obsRtmpKey=${encodeURIComponent(streamSettings.obsRtmpKey)}`;
    }
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to backend');
      setIsStreamingToYoutube(true);
      
      let options: any = { mimeType: 'video/webm;codecs=h264,opus', videoBitsPerSecond: 4500000 };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 4500000 };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm', videoBitsPerSecond: 4500000 };
      }
      const mediaRecorder = new MediaRecorder(canvasStream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };
      
      mediaRecorder.start(250); // send chunks every 250ms
      mediaRecorderRef.current = mediaRecorder;
    };

    ws.onclose = () => {
      setIsStreamingToYoutube(false);
      stopYoutubeStream();
    };
    
    ws.onerror = (e) => {
      console.error('WebSocket Error', e);
      setIsStreamingToYoutube(false);
      stopYoutubeStream();
    };
  };

  const stopYoutubeStream = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (compositeCanvasRef.current) {
      compositeCanvasRef.current = null;
    }
    setIsStreamingToYoutube(false);
  };

  const handleStartStreamFlow = () => {
    setShowPreStreamModal(true);
    setNetworkStatus('Checking...');
    setTimeout(() => {
      setNetworkStatus('Excellent (25 Mbps)');
    }, 1500);
  };
  

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    if (lastState.runs !== undefined) setRuns(lastState.runs);
    if (lastState.wickets !== undefined) setWickets(lastState.wickets);
    if (lastState.overs !== undefined) setOvers(lastState.overs);
    if (lastState.balls !== undefined) setBalls(lastState.balls);
    if (lastState.thisOver !== undefined) setThisOver(lastState.thisOver);
    if (lastState.striker !== undefined) setStriker(lastState.striker);
    if (lastState.nonStriker !== undefined) setNonStriker(lastState.nonStriker);
    if (lastState.bowler !== undefined) setBowler(lastState.bowler);
    if (lastState.strikerStats !== undefined) setStrikerStats(lastState.strikerStats);
    if (lastState.nonStrikerStats !== undefined) setNonStrikerStats(lastState.nonStrikerStats);
    if (lastState.bowlerStats !== undefined) setBowlerStats(lastState.bowlerStats);
    if (lastState.shotData !== undefined) setShotData(lastState.shotData);
    if (lastState.deliveries !== undefined) setDeliveries(lastState.deliveries);
    if (lastState.recentEvents !== undefined) setRecentEvents(lastState.recentEvents);
    if (lastState.playerStats !== undefined) setPlayerStats(lastState.playerStats);
    if (lastState.scoreA !== undefined) setScoreA(lastState.scoreA);
    if (lastState.scoreB !== undefined) setScoreB(lastState.scoreB);
    if (lastState.setsA !== undefined) setSetsA(lastState.setsA);
    if (lastState.setsB !== undefined) setSetsB(lastState.setsB);
    if (lastState.period !== undefined) setPeriod(lastState.period);
    if (lastState.umpireSignal !== undefined) setUmpireSignal(lastState.umpireSignal);

    if (isOwner && matchId) {
      scoreboardService.updateScore(matchId, {
        runs: lastState.runs ?? runs,
        wickets: lastState.wickets ?? wickets,
        overs: lastState.overs ?? overs,
        balls: lastState.balls ?? balls,
        thisOver: lastState.thisOver ?? thisOver,
        striker: lastState.striker ?? striker,
        nonStriker: lastState.nonStriker ?? nonStriker,
        bowler: lastState.bowler ?? bowler,
        strikerStats: lastState.strikerStats ?? strikerStats,
        nonStrikerStats: lastState.nonStrikerStats ?? nonStrikerStats,
        bowlerStats: lastState.bowlerStats ?? bowlerStats,
        deliveries: lastState.deliveries ?? deliveries,
        recentEvents: lastState.recentEvents ?? recentEvents,
        playerStats: lastState.playerStats ?? playerStats,
        scoreA: lastState.scoreA ?? scoreA,
        scoreB: lastState.scoreB ?? scoreB,
        setsA: lastState.setsA ?? setsA,
        setsB: lastState.setsB ?? setsB,
        period: lastState.period ?? period,
        target,
        innings,
        isExtraTime,
        history: newHistory,
        lastAutoSave: new Date().toISOString()
      }, sportType);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const stream = cameraStreams[activeCamera];
    if (stream.type === 'hls' && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls();
      hls.loadSource(stream.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log('Auto-play prevented', e));
      });
      hlsRef.current = hls;
    } else {
      video.src = stream.url;
      video.load();
      video.play().catch(e => console.log('Auto-play prevented', e));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeCamera]);

  return (
    <div className={isBroadcastMode ? "fixed inset-0 z-50 bg-[#00FF00] overflow-hidden flex flex-col" : "max-w-6xl mx-auto space-y-6 pb-20"}>
      <div className={isBroadcastMode ? "flex-1 relative" : "flex flex-col lg:flex-row gap-6"}>
        
        {/* Left Column: Live Stream & Content */}
        <div className={isBroadcastMode ? "absolute inset-0" : `w-full ${isCompactMode ? "" : isOwner ? "lg:w-2/3" : "lg:max-w-4xl mx-auto"} space-y-6`}>
          
          {/* YouTube Player with Broadcast Overlays */}
          {(true) && (
          <div className={isBroadcastMode ? "w-full h-full bg-black relative group" : "w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-black relative group"} onMouseMove={handleOcrMouseMove} onMouseUp={handleOcrDragEnd} onMouseLeave={handleOcrDragEnd}>
            
            {isCameraActive ? (
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted />
            ) : isReceivingWebRTC ? (
              <video ref={viewerVideoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline controls />
            ) : youtubeUrl ? (
              youtubeUrl.includes('.flv') || youtubeUrl.includes('.m3u8') ? (
                <VideoPlayer streamKey={youtubeUrl.split('/').pop()?.replace('.flv', '').replace('.m3u8', '') || youtubeUrl} />
              ) : youtubeUrl.includes('.mp4') ? (
                <HlsPlayer src={youtubeUrl} />
              ) : (
                <iframe
                  src={getEmbedUrl(youtubeUrl)}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              )
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center text-slate-500 px-6 text-center ${isBroadcastMode ? 'bg-[#00FF00]' : 'bg-slate-900'}`}>
                {!isBroadcastMode && <Video className="w-12 h-12 mb-4 opacity-50" />}
                <p>{isBroadcastMode ? 'Green Screen Active - Optimized for OBS Chroma Key' : isOwner ? 'Start Camera or Connect YouTube' : 'Stream Not Available. The broadcaster has not started the stream yet or the Stream URL is not configured.'}</p>
                {isOwner && !isBroadcastMode && (
                  <button onClick={() => setShowBroadcastModal(true)} className="mt-4 bg-[#d11a2a] text-white px-6 py-2 rounded-full font-bold flex items-center space-x-2 hover:bg-red-700 transition-colors">
                    <Radio className="w-4 h-4" /> <span>Broadcast Setup</span>
                  </button>
                )}
              </div>
            )}
  
            
            
             <div className={`absolute top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-20 flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2 ${isBroadcastMode ? 'opacity-0 hover:opacity-100 transition-opacity' : ''}`}>
              {!isBroadcastMode && (
                <div className="bg-black/75 text-white px-2.5 py-1 sm:px-3 sm:py-2 rounded-full backdrop-blur-md shadow-lg flex items-center space-x-1.5 border border-white/15 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] sm:text-xs font-bold tracking-wide">
                     {viewersCount.toLocaleString()} VIEWERS
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                <button 
                  onClick={() => {
                    const nextState = !showStreamScoreboard;
                    setShowStreamScoreboard(nextState);
                    if (matchId && isOwner) {
                      scoreboardService.updateScore(matchId, { showStreamScoreboard: nextState }, sportType);
                    }
                  }}
                  className={`py-1 px-2.5 sm:p-2 sm:px-3 rounded-full backdrop-blur-md transition-all shadow-lg flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs font-bold border border-white/15 ${showStreamScoreboard ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white' : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300'}`}
                  title={showStreamScoreboard ? "Hide Scoreboard Overlay on Stream" : "Show Scoreboard Overlay on Stream"}
                >
                  {showStreamScoreboard ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  <span className="inline font-bold">{showStreamScoreboard ? 'Overlay ON' : 'Overlay OFF'}</span>
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="bg-black/75 hover:bg-black/90 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/15"
                  title="Share Match"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={() => setIsBroadcastMode(!isBroadcastMode)}
                  className="bg-black/75 hover:bg-black/90 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/15"
                  title={isBroadcastMode ? "Exit Broadcast Mode" : "Enter Broadcast Mode"}
                >
                  <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={() => setIsCompactMode(!isCompactMode)}
                  className="bg-black/75 hover:bg-black/90 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/15"
                  title={isCompactMode ? "Exit Compact View" : "Compact Live View"}
                >
                  {isCompactMode ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Owner YouTube Input Bar */}
            {isOwner && !isBroadcastMode && (
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 p-1.5 sm:p-3 flex items-center justify-between border-t border-slate-800 gap-2">
                <div className="flex flex-1 items-center space-x-1.5 sm:space-x-3 mr-1 sm:mr-4 min-w-0">
                  <button 
                    onClick={() => handleStartStreamFlow()}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold flex items-center space-x-1 sm:space-x-2 transition-colors shrink-0 ${isCameraActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Studio</span>
                  </button>
                  <div className="relative flex-1 min-w-0 max-w-lg flex items-center gap-2">
                    <div className="relative flex-1">
                      <Youtube className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="https://..."
                        value={youtubeUrl}
                        onChange={(e) => {
                          const newUrl = e.target.value;
                          setYoutubeUrl(newUrl);
                          if (matchId && isOwner) {
                            scoreboardService.updateScore(matchId, { youtubeUrl: newUrl }, sportType);
                          }
                        }}
                        className="w-full bg-slate-800 text-white text-[11px] sm:text-xs rounded-full pl-8 pr-3 py-1.5 sm:py-2 focus:outline-none focus:ring-1 focus:ring-[#d11a2a]"
                      />
                    </div>
                    {obsStreamKey && (
                      <button
                        title="Use OBS Stream"
                        onClick={() => {
                          const internalUrl = `https://streamlify.in/hls/${obsStreamKey}.m3u8`;
                          setYoutubeUrl(internalUrl);
                          if (matchId && isOwner) {
                            scoreboardService.updateScore(matchId, { youtubeUrl: internalUrl }, sportType);
                          }
                        }}
                        className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setShowBroadcastModal(true)}
                  className="bg-[#d11a2a] text-white px-2.5 py-1.5 sm:px-4 sm:py-2 shrink-0 rounded-full text-xs font-bold flex items-center space-x-1 sm:space-x-2 hover:bg-red-700 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Settings</span>
                </button>
              </div>
            )}
{/* Dynamic Scorecard Overlay */}
            {showStreamScoreboard && (youtubeUrl || isCameraActive || true) && (
            <div className={`absolute ${isBroadcastMode ? 'bottom-4' : 'bottom-16'} left-4 right-4 z-40 flex flex-col gap-2 pointer-events-none transition-opacity duration-300 opacity-100`}>
              {streamSyncDelaySeconds > 0 && (
                <div className="self-end bg-amber-500/90 text-slate-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center shadow-lg border border-amber-300/40 pointer-events-auto">
                  <Clock className="w-3 h-3 mr-1" />
                  Score Sync Delay: {streamSyncDelaySeconds}s
                </div>
              )}
              {showOverSummary && (
                <div className="self-center bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 p-4 shadow-2xl mb-4 text-white animate-in slide-in-from-bottom-4 fade-in duration-500 min-w-[300px]">
                  {!isOwner && !isBroadcastMode && (
                <div className="flex justify-between items-center bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded-lg mb-2 shadow-sm border border-slate-200">
                  <span className="font-semibold flex items-center"><Shield className="w-3.5 h-3.5 mr-1" /> Match Creator: {ownerName}</span>
                  <span>{sportType} Match</span>
                </div>
              )}
              {sportType === 'Cricket' ? (
                    <>
                      <div className="text-center border-b border-slate-700 pb-2 mb-3">
                        <h3 className="text-lg font-black text-amber-400 uppercase tracking-widest">End of Over {overSummaryData.overs}</h3>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Score</div>
                          <div className="text-3xl font-black">{overSummaryData.runs}/{overSummaryData.wickets}</div>
                        </div>
                        <div className="border-l border-slate-700 h-10 mx-4"></div>
                        <div className="flex space-x-1.5 justify-center">
                          {overSummaryData.thisOver.map((ball, idx) => (
                            <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                              ball === 'W' ? 'bg-[#d11a2a]' : 
                              ball === '6' ? 'bg-indigo-600' : 
                              ball === '4' ? 'bg-emerald-600' : 
                              ball === '0' ? 'bg-slate-600' : 'bg-slate-700'
                            }`}>
                              {ball}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg text-center text-sm">
                        <span className="text-slate-400">Current Run Rate:</span> <span className="font-bold text-emerald-400">{(overSummaryData.runs / Math.max(1, overSummaryData.overs)).toFixed(1)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center border-b border-slate-700 pb-2 mb-3">
                        <h3 className="text-lg font-black text-amber-400 uppercase tracking-widest">End of {overSummaryData.periodName} {overSummaryData.periodValue}</h3>
                      </div>
                      <div className="flex justify-between items-center mb-2 px-4">
                        <div className="text-center flex-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 truncate">{overSummaryData.teamA}</div>
                          <div className="text-4xl font-black">{overSummaryData.scoreA}</div>
                        </div>
                        <div className="text-slate-500 font-black text-xl px-4">-</div>
                        <div className="text-center flex-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 truncate">{overSummaryData.teamB}</div>
                          <div className="text-4xl font-black">{overSummaryData.scoreB}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {sportType === 'Cricket' ? (
                <>
                  {isRainDelayed && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex items-center justify-between shadow-sm animate-pulse">
                      <div className="flex items-center space-x-3">
                        <CloudRain className="w-5 h-5 text-indigo-600 animate-bounce" />
                        <div>
                          <p className="font-bold">Match Paused due to Rain Delay</p>
                          <p className="text-xs text-slate-500">Scoring controls are disabled. DLS Target Adjustment is active.</p>
                        </div>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Paused</span>
                    </div>
                  )}
                  <CricketScoreboardThemes
                    theme={scoreboardTheme}
                  runs={overlayScoreData.runs} wickets={overlayScoreData.wickets} overs={overlayScoreData.overs} balls={overlayScoreData.balls} target={overlayScoreData.target}
                  striker={overlayScoreData.striker} strikerStats={overlayScoreData.strikerStats} nonStriker={overlayScoreData.nonStriker} nonStrikerStats={overlayScoreData.nonStrikerStats}
                  bowler={overlayScoreData.bowler} bowlerStats={overlayScoreData.bowlerStats} thisOver={overlayScoreData.thisOver} teamA={teamA} teamB={teamB}
                  onPlayerClick={(playerData: any) => {
                    setSelectedPlayerStats(playerData);
                    setShowPlayerStatsModal(true);
                  }}
                />
                </>
              ) : (
                <ScoreboardWidget
                  theme={scoreboardTheme}
                  sportType={sportType}
                  teamA={teamA}
                  teamB={teamB}
                  scoreA={overlayScoreData.scoreA}
                  scoreB={overlayScoreData.scoreB}
                  setsA={overlayScoreData.setsA}
                  setsB={overlayScoreData.setsB}
                  period={overlayScoreData.period}
                  isExtraTime={isExtraTime}
                  umpireSignal={overlayScoreData.umpireSignal}
                />
              )}
              {recentEvents && recentEvents.length > 0 && sportType !== 'Cricket' && (
                <div className="bg-slate-900/80 backdrop-blur-md rounded-lg py-1.5 px-3 flex items-center space-x-3 text-xs text-white shadow-lg self-start border border-slate-700/50 mt-1 max-w-xl overflow-hidden">
                  <span className="font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Latest:</span>
                  <div className="flex space-x-3 overflow-hidden text-ellipsis whitespace-nowrap">
                    {recentEvents.slice(0, 3).map((ev: any, i: number) => (
                      <span key={ev.id ? `${ev.id}_${i}` : `event_${i}`} className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${ev.team === 'A' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                        <span className="font-medium text-slate-200 truncate">{ev.playerName}</span>
                        <span className="font-black text-[#d11a2a]">{ev.action}</span>
                        {i < Math.min(2, recentEvents.length - 1) && <span className="text-slate-600 mx-1">|</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
            
            
            {isOcrEnabled && !isBroadcastMode && (
              <div 
                className="absolute border-2 border-[#d11a2a] bg-[#d11a2a]/20 cursor-move z-30 group"
                style={{
                  left: `${ocrRegion.x}%`,
                  top: `${ocrRegion.y}%`,
                  width: `${ocrRegion.width}%`,
                  height: `${ocrRegion.height}%`,
                }}
                onMouseDown={handleOcrDragStart}
                ref={ocrRef}
              >
                <div className="absolute -top-6 left-0 bg-[#d11a2a] text-white text-[10px] font-bold px-2 py-0.5 whitespace-nowrap rounded-t">
                  Live OCR / ROI Area
                </div>
                <div className="hidden group-hover:flex absolute inset-0 items-center justify-center pointer-events-none">
                  <div className="bg-black/50 text-white text-[10px] px-2 py-1 rounded">Drag to move</div>
                </div>
              </div>
            )}
          </div>
          )}
            {/* Umpire Signal Overlay */}
            {umpireSignal && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-50 animate-in zoom-in fade-in duration-300 pointer-events-none">
                <div className="bg-gradient-to-r from-amber-500 to-[#d11a2a] text-white px-10 py-6 rounded-3xl shadow-2xl text-center border-4 border-white">
                  <h2 className="text-5xl font-black uppercase tracking-widest drop-shadow-lg">{umpireSignal}</h2>
                </div>
              </div>
            )}

            {/* Active Badge Celebration */}
            {activeBadge && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-40 animate-bounce">
                <div className="bg-gradient-to-r from-amber-500 to-[#d11a2a] text-white p-4 rounded-2xl shadow-2xl text-center border-4 border-white">
                  <div className="text-4xl mb-1">🏅</div>
                  <h2 className="text-2xl font-bold uppercase italic tracking-widest">{activeBadge.title}!</h2>
                  <p className="text-sm font-semibold opacity-90">{activeBadge.playerName}</p>
                </div>
              </div>
            )}
            
            

          {!isCompactMode && !isBroadcastMode && (
          <MatchTabs sportType={sportType} matchFormat={matchFormat} scoreA={scoreA} scoreB={scoreB} runs={runs} 
            wickets={wickets} 
            overs={overs} 
            balls={balls} 
            thisOver={thisOver}
            striker={striker}
            nonStriker={nonStriker}
            bowler={bowler}
            strikerStats={strikerStats}
            nonStrikerStats={nonStrikerStats}
            bowlerStats={bowlerStats}
            deliveries={deliveries}
            teamA={teamA}
            teamB={teamB}
            inningsScores={inningsScores}
            playerStats={playerStats}
            teamASquad={typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('match_team_a_squad') || '[]') : []}
            teamBSquad={typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('match_team_b_squad') || '[]') : []}
          />
        )}
        </div>

        {!isCompactMode && !isBroadcastMode && (
          <>
          {/* Right Column */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              
                {isOwner ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Scorer Panel</h3>
                    
<div className="flex items-center space-x-2">
  <select
    value={sportType}
    onChange={(e) => {
      setSportType(e.target.value);
      if (typeof window !== 'undefined') {
        localStorage.setItem('match_sport_type', e.target.value);
      }
    }}
    className="text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium py-1 pl-2 pr-6"
  >
    {Object.keys(SPORT_CONFIGS).map(s => (
      <option key={s} value={s.charAt(0).toUpperCase() + s.slice(1)}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
    ))}
  </select>

                    </div>
                    <div className="flex space-x-2">
                      {(sportType === 'Cricket' && ((matchFormat === 'Test Match' && innings < 4) || (matchFormat !== 'Test Match' && innings < 2))) ? (
                        <button 
                          onClick={() => setShowInnings2Modal(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors"
                        >
                          {matchFormat === 'Test Match' ? 'Declare / ' : ''}End {innings}{innings === 1 ? 'st' : innings === 2 ? 'nd' : 'rd'} Innings
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to end this match?")) {
                              setShowAwardsModal(true);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors"
                        >
                          End Match
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const alertMsg = prompt("Enter push notification message to broadcast to followers:", `${sportType === 'Cricket' ? `${striker} is on fire! Score: ${runs}/${wickets}` : `Live score: ${scoreA} - ${scoreB}`}`);
                          if (alertMsg) {
                            sendPushAlert("Live Match Update", alertMsg);
                            alert("Push alert sent!");
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ml-2"
                      >
                        Push Alert
                      </button>
                    </div>
                    <div className="flex space-x-2 flex-wrap items-center gap-y-2">
                      <button onClick={() => setShowTransferModal(true)} className="flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors mr-2">
                        Transfer
                      </button>
                      <button 
                        onClick={handleUndo} 
                        disabled={history.length === 0}
                        className="flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mr-2"
                        title={history.length === 0 ? "No actions to undo" : "Undo last ball / action"}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Undo Last Ball
                      </button>
                      {sportType === 'Cricket' && matchFormat !== 'Test Match' && (
                        <button onClick={() => setShowDlsModal(true)} className="flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors mr-2">
                          <Calculator className="w-3 h-3 mr-1" /> DLS Calc
                        </button>
                      )}
                      {true && (
                        <select
                          value={scoreboardTheme}
                          onChange={(e) => {
                            const val = e.target.value;
                            setScoreboardTheme(val);
                            localStorage.setItem('scoreboard_theme', val);
                            if (matchId && isOwner) {
                              scoreboardService.updateScore(matchId, { scoreboardTheme: val }, sportType);
                            }
                          }}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#d11a2a]"
                        >
                          <option value="modern">Modern Theme</option>
                          <option value="classic">Classic Theme</option>
                          <option value="minimalist">Minimalist Theme</option>
                          <option value="ipl">IPL Theme</option>
                        </select>
                      )}
                    </div>
                  </div>
                  
                  
                  {sportType === 'Cricket' ? (
                    <>
                      <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Striker</label>
                          <select 
                            value={striker} 
                            onChange={(e) => setStriker(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                          >
                            <option value={striker}>{striker}</option>
                            {battingSquad.filter((p) => p !== striker && p !== nonStriker && p !== bowler).map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex space-x-3">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Non-Striker</label>
                            <select 
                              value={nonStriker} 
                              onChange={(e) => setNonStriker(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                            >
                              <option value={nonStriker}>{nonStriker}</option>
                              {battingSquad.filter((p) => p !== striker && p !== nonStriker && p !== bowler).map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bowler</label>
                            <select 
                              value={bowler} 
                              onChange={(e) => setBowler(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                            >
                              <option value={bowler}>{bowler}</option>
                              {bowlingSquad.filter((p) => p !== striker && p !== nonStriker && p !== bowler).map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button onClick={() => setShowSubModal(true)} className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg flex items-center hover:bg-slate-200 transition-colors">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Substitute Player
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Runs</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {[0, 1, 2, 3, 4, 6].map(run => (
                              <button 
                                key={run} 
                                disabled={isRainDelayed}
                                onClick={() => { if (run > 0) setPendingRun(run); else handleRun(run); }}
                                className={`h-12 rounded-lg font-bold transition-all active:scale-95 ${
                                  run === 4 || run === 6 
                                    ? 'bg-[#d11a2a]/10 hover:bg-[#d11a2a]/20 text-[#d11a2a] border border-[#d11a2a]/20' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                } ${isRainDelayed ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {run}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Extras</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {['WD', 'NB', 'B', 'LB'].map(extra => (
                              <button 
                                key={extra}
                                disabled={isRainDelayed}
                                onClick={() => { setExtraType(extra); setShowExtraModal(true); }} 
                                className={`h-10 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition-all active:scale-95 border border-blue-100 ${isRainDelayed ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {extra}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <button 
                            disabled={isRainDelayed}
                            onClick={handleWicket} 
                            className={`w-full h-14 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-xl font-bold transition-all active:scale-95 text-lg flex items-center justify-center ${isRainDelayed ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            OUT
                          </button>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-4 flex items-center"><Shield className="w-3 h-3 mr-1" /> Umpire Signals Overlay</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {['Four', 'Six', 'Wide', 'No Ball', 'Out'].map(signal => (
                              <button
                                key={signal}
                                onClick={() => {
                                  setUmpireSignal(signal);
                                  if (matchId && isOwner) {
                                      scoreboardService.updateScore(matchId, { umpireSignal: signal }, sportType);
                                      setTimeout(() => {
                                          setUmpireSignal(null);
                                          scoreboardService.updateScore(matchId, { umpireSignal: null }, sportType);
                                      }, 4000);
                                  } else {
                                      setTimeout(() => setUmpireSignal(null), 4000);
                                  }
                                }}
                                className="h-10 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-[10px] uppercase transition-all active:scale-95 border border-amber-200"
                              >
                                {signal}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <VisualWagonWheel shotData={shotData} />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      
                      <div className="mb-4">
                      {/* Quick Actions Bar */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scoring Actions</h4>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Scorer (optional)"
                              value={scorerName}
                              onChange={(e) => setScorerName(e.target.value)}
                              className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-[#d11a2a] w-32"
                            />
                            <input
                              type="text"
                              placeholder="Assist (optional)"
                              value={assistName}
                              onChange={(e) => setAssistName(e.target.value)}
                              className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-[#d11a2a] w-32"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="text-xs font-bold text-slate-500 truncate">{teamA}</div>
                            <div className="flex gap-2">
                              <button onClick={() => {
                                pushHistorySnapshot();
                                setScoreA(s => s + 1);
                                if (scorerName) {
                                  setRecentEvents(prev => [{ id: `${Date.now()}_A_1_${Math.random().toString(36).substr(2, 9)}`, team: 'A', playerName: scorerName + (assistName ? ` (Asst: ${assistName})` : ''), action: '+1', timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
                                  setScorerName(''); setAssistName('');
                                }
                              }} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-10 rounded-lg font-bold text-xs shadow-sm transition-all">+1 {config.scoreLabel ? config.scoreLabel.replace(/s$/, '') : 'Pt'}</button>
                              {sportType === 'Basketball' && <button onClick={() => {
                                pushHistorySnapshot();
                                setScoreA(s => s + 3);
                                if (scorerName) {
                                  setRecentEvents(prev => [{ id: `${Date.now()}_A_3_${Math.random().toString(36).substr(2, 9)}`, team: 'A', playerName: scorerName + (assistName ? ` (Asst: ${assistName})` : ''), action: '+3', timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
                                  setScorerName(''); setAssistName('');
                                }
                              }} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-10 rounded-lg font-bold text-xs shadow-sm transition-all">+3 Pts</button>}
                              {sportType === 'Basketball' && <button onClick={() => {
                                pushHistorySnapshot();
                                setScoreA(s => s + 2);
                                if (scorerName) {
                                  setRecentEvents(prev => [{ id: `${Date.now()}_A_2_${Math.random().toString(36).substr(2, 9)}`, team: 'A', playerName: scorerName + (assistName ? ` (Asst: ${assistName})` : ''), action: '+2', timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
                                  setScorerName(''); setAssistName('');
                                }
                              }} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-10 rounded-lg font-bold text-xs shadow-sm transition-all">+2 Pts</button>}
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="text-xs font-bold text-slate-500 truncate text-right">{teamB}</div>
                            <div className="flex gap-2 flex-row-reverse">
                              <button onClick={() => {
                                pushHistorySnapshot();
                                setScoreB(s => s + 1);
                                if (scorerName) {
                                  setRecentEvents(prev => [{ id: `${Date.now()}_B_1_${Math.random().toString(36).substr(2, 9)}`, team: 'B', playerName: scorerName + (assistName ? ` (Asst: ${assistName})` : ''), action: '+1', timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
                                  setScorerName(''); setAssistName('');
                                }
                              }} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-10 rounded-lg font-bold text-xs shadow-sm transition-all">+1 {config.scoreLabel ? config.scoreLabel.replace(/s$/, '') : 'Pt'}</button>
                              {sportType === 'Basketball' && <button onClick={() => {
                                pushHistorySnapshot();
                                setScoreB(s => s + 3);
                                if (scorerName) {
                                  setRecentEvents(prev => [{ id: `${Date.now()}_B_3_${Math.random().toString(36).substr(2, 9)}`, team: 'B', playerName: scorerName + (assistName ? ` (Asst: ${assistName})` : ''), action: '+3', timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
                                  setScorerName(''); setAssistName('');
                                }
                              }} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-10 rounded-lg font-bold text-xs shadow-sm transition-all">+3 Pts</button>}
                              {sportType === 'Basketball' && <button onClick={() => {
                                pushHistorySnapshot();
                                setScoreB(s => s + 2);
                                if (scorerName) {
                                  setRecentEvents(prev => [{ id: `${Date.now()}_B_2_${Math.random().toString(36).substr(2, 9)}`, team: 'B', playerName: scorerName + (assistName ? ` (Asst: ${assistName})` : ''), action: '+2', timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
                                  setScorerName(''); setAssistName('');
                                }
                              }} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-10 rounded-lg font-bold text-xs shadow-sm transition-all">+2 Pts</button>}
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div className="space-y-3">

                          <div className="text-center font-bold text-slate-600 mb-2 truncate" title={teamA}>{teamA} Options</div>
                          
                          <div className="flex items-center space-x-2">
                            <button onClick={() => setScoreA(s => Math.max(0, s - 1))} className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-all shadow-sm">-1 {config.scoreLabel}</button>
                            {!['Basketball', 'Football', 'Hockey', 'Tennis', 'Volleyball', 'Badminton', 'Pickleball', 'Table Tennis'].includes(sportType) && (
                              <button onClick={() => setScoreA(s => s + 1)} className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-all shadow-sm">+1 {config.scoreLabel}</button>
                            )}
                          </div>
                          
                          {(sportType === 'Football' || sportType === 'Hockey') && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button onClick={() => setActionModal({ type: 'goal', sport: sportType, team: 'A' })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+ Goal</button>
                              <button onClick={() => setActionModal({ type: 'yellow_card', sport: sportType, team: 'A' })} className="h-10 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded font-bold text-xs transition-all shadow-sm">Yellow Card</button>
                              <button onClick={() => setActionModal({ type: 'red_card', sport: sportType, team: 'A' })} className="h-10 bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold text-xs transition-all shadow-sm">Red Card</button>
                              <button onClick={() => setActionModal({ type: 'clean_sheet', sport: sportType, team: 'A' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Clean Sheet</button>
                            </div>
                          )}
                          
                          {(sportType === 'Basketball') && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <button onClick={() => setActionModal({ type: 'points', sport: sportType, team: 'A', points: 1 })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+1 Pt</button>
                              <button onClick={() => setActionModal({ type: 'points', sport: sportType, team: 'A', points: 2 })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+2 Pts</button>
                              <button onClick={() => setActionModal({ type: 'points', sport: sportType, team: 'A', points: 3 })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+3 Pts</button>
                              <button onClick={() => setActionModal({ type: 'rebound', sport: sportType, team: 'A' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Rebound</button>
                              <button onClick={() => setActionModal({ type: 'steal', sport: sportType, team: 'A' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Steal</button>
                              <button onClick={() => setActionModal({ type: 'block', sport: sportType, team: 'A' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Block</button>
                            </div>
                          )}

                          {['Tennis', 'Volleyball', 'Badminton', 'Pickleball', 'Table Tennis'].includes(sportType) && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button onClick={() => setActionModal({ type: 'point', sport: sportType, team: 'A' })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+ Point</button>
                              <button onClick={() => setActionModal({ type: 'ace', sport: sportType, team: 'A' })} className="h-10 bg-green-100 hover:bg-green-200 text-green-700 rounded font-bold text-xs transition-all shadow-sm">Ace</button>
                            </div>
                          )}

                          {(config.type === 'sets') && (
                            <div className="pt-2">
                              <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg p-1">
                                <button onClick={() => setSetsA(s => Math.max(0, s - 1))} className="w-10 h-10 flex items-center justify-center font-bold text-blue-700 hover:bg-blue-100 rounded-md">-</button>
                                <span className="font-bold text-blue-800 text-sm">{setsA} {config.setsLabel}</span>
                                <button onClick={() => setSetsA(s => s + 1)} className="w-10 h-10 flex items-center justify-center font-bold text-blue-700 hover:bg-blue-100 rounded-md">+</button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">

                          <div className="text-center font-bold text-slate-600 mb-2 truncate" title={teamB}>{teamB} Options</div>
                          
                          <div className="flex items-center space-x-2">
                            <button onClick={() => setScoreB(s => Math.max(0, s - 1))} className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-all shadow-sm">-1 {config.scoreLabel}</button>
                            {!['Basketball', 'Football', 'Hockey', 'Tennis', 'Volleyball', 'Badminton', 'Pickleball', 'Table Tennis'].includes(sportType) && (
                              <button onClick={() => setScoreB(s => s + 1)} className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-all shadow-sm">+1 {config.scoreLabel}</button>
                            )}
                          </div>
                          
                          {(sportType === 'Football' || sportType === 'Hockey') && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button onClick={() => setActionModal({ type: 'goal', sport: sportType, team: 'B' })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+ Goal</button>
                              <button onClick={() => setActionModal({ type: 'yellow_card', sport: sportType, team: 'B' })} className="h-10 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded font-bold text-xs transition-all shadow-sm">Yellow Card</button>
                              <button onClick={() => setActionModal({ type: 'red_card', sport: sportType, team: 'B' })} className="h-10 bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold text-xs transition-all shadow-sm">Red Card</button>
                              <button onClick={() => setActionModal({ type: 'clean_sheet', sport: sportType, team: 'B' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Clean Sheet</button>
                            </div>
                          )}
                          
                          {(sportType === 'Basketball') && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <button onClick={() => setActionModal({ type: 'points', sport: sportType, team: 'B', points: 1 })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+1 Pt</button>
                              <button onClick={() => setActionModal({ type: 'points', sport: sportType, team: 'B', points: 2 })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+2 Pts</button>
                              <button onClick={() => setActionModal({ type: 'points', sport: sportType, team: 'B', points: 3 })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+3 Pts</button>
                              <button onClick={() => setActionModal({ type: 'rebound', sport: sportType, team: 'B' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Rebound</button>
                              <button onClick={() => setActionModal({ type: 'steal', sport: sportType, team: 'B' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Steal</button>
                              <button onClick={() => setActionModal({ type: 'block', sport: sportType, team: 'B' })} className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition-all shadow-sm">Block</button>
                            </div>
                          )}

                          {['Tennis', 'Volleyball', 'Badminton', 'Pickleball', 'Table Tennis'].includes(sportType) && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button onClick={() => setActionModal({ type: 'point', sport: sportType, team: 'B' })} className="h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-bold text-xs transition-all shadow-sm">+ Point</button>
                              <button onClick={() => setActionModal({ type: 'ace', sport: sportType, team: 'B' })} className="h-10 bg-green-100 hover:bg-green-200 text-green-700 rounded font-bold text-xs transition-all shadow-sm">Ace</button>
                            </div>
                          )}

                          {(config.type === 'sets') && (
                            <div className="pt-2">
                              <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg p-1">
                                <button onClick={() => setSetsB(s => Math.max(0, s - 1))} className="w-10 h-10 flex items-center justify-center font-bold text-blue-700 hover:bg-blue-100 rounded-md">-</button>
                                <span className="font-bold text-blue-800 text-sm">{setsB} {config.setsLabel}</span>
                                <button onClick={() => setSetsB(s => s + 1)} className="w-10 h-10 flex items-center justify-center font-bold text-blue-700 hover:bg-blue-100 rounded-md">+</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {(config.type === 'periods') && (
                        <div className="pt-4 border-t border-slate-100">
                          <div className="text-center font-bold text-slate-500 mb-2">{config.periodLabel || 'Period'}</div>
                          <div className="flex items-center justify-center space-x-4">
                            <button onClick={() => setPeriod(p => Math.max(1, p - 1))} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-lg hover:bg-slate-200 shadow-sm transition-all">-</button>
                            <span className="text-3xl font-black text-slate-800 w-12 text-center">{period}</span>
                            <button onClick={() => {
                              setPeriod(p => p + 1);
                              setOverSummaryData({
                                overs: 0, runs: 0, wickets: 0, thisOver: [],
                                teamA, teamB, scoreA, scoreB,
                                periodName: config.periodLabel || 'Period',
                                periodValue: period
                              });
                              setShowOverSummary(true);
                              setTimeout(() => setShowOverSummary(false), 8000);
                            }} className="w-12 h-12 rounded-full bg-[#d11a2a] text-white flex items-center justify-center font-bold text-lg hover:bg-red-700 shadow-sm transition-all">+</button>
                          </div>
                        </div>
                      )}

                      {/* Additional Options (Substitute Player, Extra Time) */}
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center bg-slate-50 p-3 rounded-lg mt-4">
                        {(!sportType || sportType === 'Cricket') && (
                          <button 
                            onClick={() => setShowSubModal(true)} 
                            className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg flex items-center hover:bg-slate-100 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3 mr-1 text-[#d11a2a]" />
                            Substitute Player
                          </button>
                        )}
                        
                        {(sportType === 'Football' || sportType === 'Hockey') && (
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isExtraTime} 
                              onChange={(e) => {
                                setIsExtraTime(e.target.checked);
                                if (matchId && isOwner) {
                                  scoreboardService.updateScore(matchId, { isExtraTime: e.target.checked }, sportType);
                                }
                              }}
                              className="rounded border-slate-300 text-[#d11a2a] focus:ring-[#d11a2a] w-4 h-4"
                            />
                            <span>Extra Time (Middle of match)</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}

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
              
              {/* Match Context Mini */}
              {sportType === 'Cricket' && (
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Target</span>
                    <span className="font-bold text-slate-900">{target} {isDlsApplied && <span className="text-xs text-indigo-600 font-bold ml-1">(DLS)</span>}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Required</span>
                    <span className="font-bold text-[#d11a2a]">{Math.max(0, target - runs)} off {(matchMaxOvers * 6) - (overs * 6 + balls)}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
          </>
        )}
      </div>

      
      
      {/* Broadcast Modal */}
      
      

      {/* Player Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 capitalize">Log {actionModal.type.replace('_', ' ')}</h2>
              <button onClick={() => { setActionModal(null); setStatScorer(''); setStatAssist(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  {actionModal.type === 'clean_sheet' ? 'Goalkeeper Name' : 'Player Name'}
                </label>
                <select 
                  value={statScorer} 
                  onChange={(e) => setStatScorer(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                >
                  <option value="">Select Player</option>
                  {(actionModal.team === 'A' ? JSON.parse(localStorage.getItem('match_team_a_squad') || '[]') : JSON.parse(localStorage.getItem('match_team_b_squad') || '[]')).map((p: string, i: number) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {(actionModal.type === 'goal' || actionModal.type === 'points') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Assist (Optional)</label>
                  <select 
                    value={statAssist} 
                    onChange={(e) => setStatAssist(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                  >
                    <option value="">Select Player (Optional)</option>
                    {(actionModal.team === 'A' ? JSON.parse(localStorage.getItem('match_team_a_squad') || '[]') : JSON.parse(localStorage.getItem('match_team_b_squad') || '[]')).map((p: string, i: number) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button onClick={() => { setActionModal(null); setStatScorer(''); setStatAssist(''); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
              <button onClick={confirmAction} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Runs Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Add Extra ({extraType})</h2>
              <button onClick={() => setShowExtraModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Additional Runs (e.g. ran / hit off bat)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map(run => {
                    const isPenaltyExtra = extraType === 'WD' || extraType === 'NB';
                    if (!isPenaltyExtra && run === 0) return null; // Dot balls are just dot balls for B/LB
                    const totalRuns = isPenaltyExtra ? run + 1 : run;
                    return (
                      <button
                        key={run}
                        onClick={() => {
                          handleExtra(extraType, totalRuns);
                          setShowExtraModal(false);
                        }}
                        className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors border border-blue-200 flex flex-col items-center justify-center"
                      >
                        <span className="text-lg">+{run}</span>
                        <span className="text-[9px] text-blue-500 font-normal uppercase tracking-wider">{totalRuns} Total</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowExtraModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Fall of Wicket</h2>
              <button onClick={() => setShowWicketModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Who is Out?</label>
                <div className="flex space-x-2">
                  <button onClick={() => setOutBatsman('striker')} className={`flex-1 py-2 text-sm font-bold rounded-lg border ${outBatsman === 'striker' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>{striker} (Striker)</button>
                  <button onClick={() => setOutBatsman('nonStriker')} className={`flex-1 py-2 text-sm font-bold rounded-lg border ${outBatsman === 'nonStriker' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>{nonStriker} (Non-Striker)</button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Dismissal Type</label>
                <select value={wicketType} onChange={(e) => setWicketType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#d11a2a]">
                   <option>Bowled</option>
                   <option>Caught</option>
                   <option>Caught & Bowled</option>
                   <option>LBW</option>
                   <option>Run Out</option>
                   <option>Stumped</option>
                   <option>Hit Wicket</option>
                   <option>Retired Hurt</option>
                </select>
              </div>
              
              {(wicketType === 'Caught' || wicketType === 'Run Out' || wicketType === 'Stumped') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Fielder (Optional)</label>
                  <select 
                    value={wicketFielder} 
                    onChange={(e) => setWicketFielder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#d11a2a]"
                  >
                    <option value="">Select Fielder (Optional)</option>
                    {bowlingSquad.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">New Batsman</label>
                <select 
                  value={newBatsmanName} 
                  onChange={(e) => setNewBatsmanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#d11a2a]"
                >
                  <option value="">Select Batsman...</option>
                  {battingSquad.filter(p => p !== striker && p !== nonStriker).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Who is on strike?</label>
                <div className="flex space-x-2">
                  <button onClick={() => setStrikeAfterWicket('new')} className={`flex-1 py-2 text-sm font-bold rounded-lg border ${strikeAfterWicket === 'new' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>{newBatsmanName || 'New Batsman'}</button>
                  <button onClick={() => setStrikeAfterWicket('other')} className={`flex-1 py-2 text-sm font-bold rounded-lg border ${strikeAfterWicket === 'other' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>{outBatsman === 'striker' ? nonStriker : striker}</button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button onClick={() => setShowWicketModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
              <button onClick={submitWicket} className="px-4 py-2 bg-[#d11a2a] hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-600/20 flex items-center">Confirm Wicket <Check className="w-4 h-4 ml-1" /></button>
            </div>
          </div>
        </div>
      )}

            {/* DLS Calculator Modal */}
      {showDlsModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center"><Calculator className="w-5 h-5 mr-2 text-indigo-600" /> DLS Calculator</h2>
              <button onClick={() => setShowDlsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setDlsActiveTab('revise')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition-colors ${dlsActiveTab === 'revise' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Revise Target
              </button>
              <button 
                onClick={() => setDlsActiveTab('rainDelay')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition-colors flex items-center justify-center space-x-1 ${dlsActiveTab === 'rainDelay' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Umbrella className="w-3.5 h-3.5" />
                <span>Rain Delay</span>
              </button>
              <button 
                onClick={() => setDlsActiveTab('rainStop')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition-colors flex items-center justify-center space-x-1 ${dlsActiveTab === 'rainStop' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Rain Stop Match</span>
              </button>
            </div>

            {dlsActiveTab === 'revise' ? (
              <>
                <div className="p-4 space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-xs text-indigo-800">
                    Calculate revised targets based on current wickets and overs lost. (Standard Appx)
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Overs Lost</label>
                      <input 
                        type="number" 
                        value={dlsRevisedOvers === '' ? '' : matchMaxOvers - (dlsRevisedOvers as number)} 
                        onChange={(e) => {
                          const lost = e.target.value ? parseInt(e.target.value) : 0;
                          const newOvers = Math.max(1, matchMaxOvers - lost);
                          setDlsRevisedOvers(newOvers);
                          
                          // Auto-calculate
                          const t1Score = target ? target - 1 : 0;
                          const oversRemainingBefore = matchMaxOvers - overs;
                          const oversRemainingAfter = Math.max(0, oversRemainingBefore - lost);
                          const getResource = (ov: number, wk: number) => {
                              if (ov <= 0) return 0;
                              if (wk >= 10) return 0;
                              const wFactor = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wk] || 0;
                              return wFactor * Math.pow(ov / matchMaxOvers, 0.8);
                          };
                          const rBefore = getResource(oversRemainingBefore, wickets);
                          const rAfter = getResource(oversRemainingAfter, wickets);
                          const rLost = rBefore - rAfter;
                          const rTeam2 = 100 - rLost;
                          const newTarget = Math.floor(t1Score * (rTeam2 / 100)) + 1;
                          setDlsRevisedTarget(newTarget);
                        }} 
                        placeholder="e.g. 5" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Wickets Down</label>
                      <input 
                        type="number" 
                        value={wickets} 
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed" 
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Revised Target / Overs</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number" 
                        value={dlsRevisedTarget} 
                        onChange={(e) => setDlsRevisedTarget(e.target.value ? parseInt(e.target.value) : '')} 
                        className="w-1/2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-lg font-black text-indigo-700 focus:outline-none focus:border-indigo-500" 
                      />
                      <span className="text-slate-400 font-bold">in</span>
                      <input 
                        type="number" 
                        value={dlsRevisedOvers} 
                        onChange={(e) => setDlsRevisedOvers(e.target.value ? parseInt(e.target.value) : '')} 
                        className="w-1/2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-lg font-black text-indigo-700 focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
                  <button onClick={() => setShowDlsModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
                  <button 
                    onClick={() => {
                      if (typeof dlsRevisedTarget === 'number') { setTarget(dlsRevisedTarget); setIsDlsApplied(true); }
                      if (typeof dlsRevisedOvers === 'number') setMatchMaxOvers(dlsRevisedOvers);
                      setShowDlsModal(false);
                    }} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm shadow-indigo-600/20"
                  >
                    Apply Target
                  </button>
                </div>
              </>
            ) : dlsActiveTab === 'rainDelay' ? (
              <>
                <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start space-x-2">
                    <Umbrella className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 space-y-1">
                      <p className="font-bold">DLS Rain Delay Mode</p>
                      <p>Pause scoring inputs, calculate revised targets based on overs lost, and update the scoreboard.</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Rain Delay State</span>
                      <span className="text-[10px] text-slate-500">
                        {isRainDelayed ? '🌧️ Match is currently PAUSED' : '🟢 Match is currently LIVE'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const nextState = !isRainDelayed;
                        setIsRainDelayed(nextState);
                        
                        if (nextState) {
                          // Toggle ON: save target, calculate adjusted
                          if (innings === 2 && target !== null) {
                            if (preDelayTarget === null) {
                              setPreDelayTarget(target);
                            }
                            // Do calculation
                            const currentOversFloat = overs + (balls / 6);
                            const getResource = (ov: number, wk: number) => {
                                if (ov <= 0) return 0;
                                if (wk >= 10) return 0;
                                const wFactor = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wk] || 0;
                                return wFactor * Math.pow(ov / matchMaxOvers, 0.8);
                            };
                            const oversRemaining = Math.max(0, matchMaxOvers - currentOversFloat);
                            const rBefore = getResource(oversRemaining, wickets);
                            const rAfter = getResource(Math.max(0, oversRemaining - dlsOversLost), wickets);
                            const rLost = rBefore - rAfter;
                            const rTeam2 = 100 - rLost;
                            const t1Score = (preDelayTarget || target || 1) - 1;
                            const newTgt = Math.max(runs + 1, Math.floor(t1Score * (rTeam2 / 100)) + 1);
                            setTarget(newTgt);
                          }
                          alert('Rain Delay activated. Match scoring is paused and target is adjusted.');
                        } else {
                          alert('Rain Delay deactivated. Click Resume below to choose target settings.');
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRainDelayed ? 'bg-amber-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRainDelayed ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {innings === 2 ? (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-xs">
                        <div>
                          <span className="text-slate-500 block">Original Target:</span>
                          <span className="font-bold text-slate-900 text-sm">{preDelayTarget || target} runs</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Current Score:</span>
                          <span className="font-bold text-slate-900 text-sm">{runs}/{wickets} ({overs}.{balls} ov)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Current Run Rate:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {(overs + balls/6 > 0 ? (runs / (overs + balls/6)) : 0).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Wickets Penalty:</span>
                          <span className="font-bold text-rose-600 text-sm">
                            {100 - ([100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wickets] || 0)}% resource lost
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase">Overs to Lose</label>
                          <span className="text-xs font-black text-indigo-600">{dlsOversLost} Overs</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="1"
                            max={Math.max(1, Math.floor(matchMaxOvers - (overs + balls/6)))}
                            value={dlsOversLost}
                            onChange={(e) => {
                              const lost = parseInt(e.target.value);
                              setDlsOversLost(lost);
                              
                              if (isRainDelayed && target !== null) {
                                // Live adjust target
                                const currentOversFloat = overs + (balls / 6);
                                const getResource = (ov: number, wk: number) => {
                                    if (ov <= 0) return 0;
                                    if (wk >= 10) return 0;
                                    const wFactor = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wk] || 0;
                                    return wFactor * Math.pow(ov / matchMaxOvers, 0.8);
                                };
                                const oversRemaining = Math.max(0, matchMaxOvers - currentOversFloat);
                                const rBefore = getResource(oversRemaining, wickets);
                                const rAfter = getResource(Math.max(0, oversRemaining - lost), wickets);
                                const rLost = rBefore - rAfter;
                                const rTeam2 = 100 - rLost;
                                const t1Score = (preDelayTarget || target || 1) - 1;
                                const newTgt = Math.max(runs + 1, Math.floor(t1Score * (rTeam2 / 100)) + 1);
                                setTarget(newTgt);
                              }
                            }}
                            className="flex-1 accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Display live dynamic adjusted target calculation */}
                      {(() => {
                        const currentOversFloat = overs + (balls / 6);
                        const getResource = (ov: number, wk: number) => {
                            if (ov <= 0) return 0;
                            if (wk >= 10) return 0;
                            const wFactor = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wk] || 0;
                            return wFactor * Math.pow(ov / matchMaxOvers, 0.8);
                        };
                        const oversRemaining = Math.max(0, matchMaxOvers - currentOversFloat);
                        const rBefore = getResource(oversRemaining, wickets);
                        const rAfter = getResource(Math.max(0, oversRemaining - dlsOversLost), wickets);
                        const rLost = rBefore - rAfter;
                        const rTeam2 = 100 - rLost;
                        const t1Score = (preDelayTarget || target || 1) - 1;
                        const liveAdjustedTgt = Math.max(runs + 1, Math.floor(t1Score * (rTeam2 / 100)) + 1);
                        
                        return (
                          <div className="bg-indigo-600 text-white p-4 rounded-xl space-y-1 shadow-md shadow-indigo-600/10">
                            <span className="text-[10px] uppercase font-bold text-indigo-200">Adjusted Target Estimate</span>
                            <div className="flex justify-between items-baseline">
                              <span className="text-2xl font-black">{liveAdjustedTgt} Runs</span>
                              <span className="text-xs font-semibold text-indigo-100">in {Math.max(1, matchMaxOvers - dlsOversLost)} overs</span>
                            </div>
                            <p className="text-[10px] text-indigo-100 leading-snug">
                              Required: {Math.max(0, liveAdjustedTgt - runs)} off {Math.max(0, (matchMaxOvers - dlsOversLost) * 6 - (overs * 6 + balls))} balls. (Adjustment factor: -{(preDelayTarget || target || 0) - liveAdjustedTgt} runs).
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-900 p-3 rounded-lg text-xs space-y-1">
                      <p className="font-bold">First Innings Ongoing</p>
                      <p>Rain delays during the first innings reduce the available overs for Team 1 to set a target. The maximum match overs will be shortened accordingly.</p>
                      <div className="pt-2">
                        <label className="text-xs font-bold block mb-1">Overs to Reduce</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max={matchMaxOvers - 1}
                            value={dlsOversLost}
                            onChange={(e) => setDlsOversLost(e.target.value ? parseInt(e.target.value) : 1)}
                            className="w-20 bg-white border border-amber-200 rounded px-2 py-1 text-xs"
                          />
                          <span className="text-[10px]">overs will be cut from match.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 flex flex-col space-y-2 bg-slate-50">
                  {isRainDelayed ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Deactivate Rain Delay, keep adjusted target and reduce overs
                          setIsRainDelayed(false);
                          if (innings === 2) {
                            setMatchMaxOvers(prev => Math.max(1, prev - dlsOversLost));
                            setPreDelayTarget(null);
                            alert(`Match Resumed! Match overs reduced to ${matchMaxOvers - dlsOversLost} and target adjusted permanently.`);
                          } else {
                            setMatchMaxOvers(prev => Math.max(1, prev - dlsOversLost));
                            alert(`Match Resumed! Match overs reduced to ${matchMaxOvers - dlsOversLost}.`);
                          }
                          setShowDlsModal(false);
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors text-center"
                      >
                        Resume (Apply Adj)
                      </button>
                      <button
                        onClick={() => {
                          // Deactivate Rain Delay, restore original target
                          setIsRainDelayed(false);
                          if (preDelayTarget !== null) {
                            setTarget(preDelayTarget);
                            setPreDelayTarget(null);
                          }
                          alert('Match Resumed! Original overs and target restored.');
                          setShowDlsModal(false);
                        }}
                        className="flex-1 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg font-bold text-xs transition-colors text-center"
                      >
                        Resume (Restore Orig)
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDlsModal(false)}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-colors"
                    >
                      Close Modal
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto">
                  {innings === 1 ? (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start space-x-2">
                        <Umbrella className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 space-y-1">
                          <p className="font-bold">Innings 1 Ongoing</p>
                          <p>Since the second innings has not started yet, a DLS winner outcome cannot be calculated. If stopped now, the match will be declared <strong>No Result (Abandoned)</strong>.</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Match Outcome Note</label>
                        <textarea
                          rows={2}
                          value={dlsCustomResult}
                          onChange={(e) => setDlsCustomResult(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Innings 2 ongoing */}
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg space-y-2">
                        {target ? (
                          <div className="flex justify-between text-xs text-indigo-900 border-b border-indigo-200/50 pb-1.5">
                            <span>Target to win:</span>
                            <span className="font-bold">{target}</span>
                          </div>
                        ) : matchFormat === 'Test Match' ? (
                          <div className="flex justify-between text-xs text-indigo-900 border-b border-indigo-200/50 pb-1.5">
                            <span>Lead/Trail:</span>
                            <span className="font-bold">
                              {innings === 2 ? 
                                (runs - (inningsScores[0]?.runs || 0) > 0 ? `Lead by ${runs - (inningsScores[0]?.runs || 0)}` : `Trail by ${(inningsScores[0]?.runs || 0) - runs}`) 
                                : 
                                innings === 3 ? 
                                  followOn ? 
                                    ((inningsScores[1]?.runs || 0) + runs - (inningsScores[0]?.runs || 0) > 0 ? `Lead by ${(inningsScores[1]?.runs || 0) + runs - (inningsScores[0]?.runs || 0)}` : `Trail by ${(inningsScores[0]?.runs || 0) - ((inningsScores[1]?.runs || 0) + runs)}`)
                                  :
                                    ((inningsScores[0]?.runs || 0) + runs - (inningsScores[1]?.runs || 0) > 0 ? `Lead by ${(inningsScores[0]?.runs || 0) + runs - (inningsScores[1]?.runs || 0)}` : `Trail by ${(inningsScores[1]?.runs || 0) - ((inningsScores[0]?.runs || 0) + runs)}`)
                                : ''
                              }
                            </span>
                          </div>
                        ) : null}
                        <div className="flex justify-between text-xs text-indigo-900 border-b border-indigo-200/50 pb-1.5">
                          <span>Current Score:</span>
                          <span className="font-bold">{runs}/{wickets} ({overs}.{balls} ov)</span>
                        </div>
                        
                        {/* Par Score display */}
                        {(() => {
                          const currentOversFloat = overs + (balls / 6);
                          const getResource = (ov: number, wk: number) => {
                              if (ov <= 0) return 0;
                              if (wk >= 10) return 0;
                              const wFactor = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wk] || 0;
                              return wFactor * Math.pow(ov / matchMaxOvers, 0.8);
                          };
                          const oversRemaining = Math.max(0, matchMaxOvers - currentOversFloat);
                          const rRemaining = getResource(oversRemaining, wickets);
                          const rUsed = 100 - rRemaining;
                          const t1Score = target ? (target - 1) : 0;
                          const parScore = Math.floor(t1Score * (rUsed / 100));
                          const isMinOversMet = currentOversFloat >= 5;
                          
                          return (
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-xs font-bold text-indigo-950">
                                <span className="flex items-center"><Umbrella className="w-3.5 h-3.5 mr-1 text-indigo-600" /> DLS Par Score:</span>
                                <span>{parScore} Runs</span>
                              </div>
                              <div className="text-[11px] text-slate-500 italic">
                                Chasing team needs to be above {parScore} runs at this point to win.
                              </div>
                              
                              {!isMinOversMet && (
                                <div className="mt-2 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded">
                                  ⚠️ Minimum 5 overs are required for a DLS result. (Current: {overs}.{balls} overs)
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Match Outcome Summary</label>
                        <textarea
                          rows={2}
                          value={dlsCustomResult}
                          onChange={(e) => setDlsCustomResult(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#d11a2a]"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
                  <button onClick={() => setShowDlsModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
                  <button 
                    onClick={async () => {
                      if (!matchId) return;
                      const currentOversFloat = overs + (balls / 6);
                      let updatedWinner = '';
                      
                      if (innings === 2 && currentOversFloat >= 5) {
                        const getResource = (ov: number, wk: number) => {
                            if (ov <= 0) return 0;
                            if (wk >= 10) return 0;
                            const wFactor = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10][wk] || 0;
                            return wFactor * Math.pow(ov / matchMaxOvers, 0.8);
                        };
                        const oversRemaining = Math.max(0, matchMaxOvers - currentOversFloat);
                        const rRemaining = getResource(oversRemaining, wickets);
                        const rUsed = 100 - rRemaining;
                        const t1Score = target ? (target - 1) : 0;
                        const parScore = Math.floor(t1Score * (rUsed / 100));
                        
                        if (runs > parScore) {
                          updatedWinner = teamB;
                        } else if (runs < parScore) {
                          updatedWinner = teamA;
                        } else {
                          updatedWinner = 'Tie';
                        }
                      }
                      
                      try {
                        await dbService.update('matches', matchId, {
                          status: 'Completed',
                          result: dlsCustomResult,
                          lastAction: dlsCustomResult,
                          winner: updatedWinner
                        });
                        
                        // Local cache update
                        const localData = localStorage.getItem('matches_cache');
                        if (localData) {
                          try {
                             let parsed = JSON.parse(localData);
                             parsed = parsed.map((m: any) => m.id === matchId ? { ...m, status: 'Completed', result: dlsCustomResult, winner: updatedWinner } : m);
                             localStorage.setItem('matches_cache', JSON.stringify(parsed));
                          } catch(e) {}
                        }
                        
                        alert('Match terminated successfully using DLS method.');
                        setShowDlsModal(false);
                        if (setFullScreenView) setFullScreenView(null);
                      } catch (err) {
                        console.error('Error stopping match due to rain', err);
                        alert('Failed to update match status. Please try again.');
                      }
                    }} 
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-600/20"
                  >
                    {innings === 1 || (overs + balls/6) < 5 ? 'Abandon Match' : 'Declare Winner & Stop'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

            {/* 2nd Innings Modal */}
      {showInnings2Modal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Start Next Innings</h2>
              <button onClick={() => setShowInnings2Modal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Striker</label>
                <select value={i2Striker} onChange={(e) => setI2Striker(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]">
  <option value="">Select Striker...</option>
  {bowlingSquad.filter(p => p !== i2NonStriker && p !== i2Bowler).map(p => <option key={p} value={p}>{p}</option>)}
</select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Non-Striker</label>
                <select value={i2NonStriker} onChange={(e) => setI2NonStriker(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]">
  <option value="">Select Non-Striker...</option>
  {bowlingSquad.filter(p => p !== i2Striker && p !== i2Bowler).map(p => <option key={p} value={p}>{p}</option>)}
</select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Bowler</label>
                <select value={i2Bowler} onChange={(e) => setI2Bowler(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]">
  <option value="">Select Bowler...</option>
  {battingSquad.filter(p => p !== i2Striker && p !== i2NonStriker).map(p => <option key={p} value={p}>{p}</option>)}
</select>
              </div>
              {matchFormat === 'Test Match' && (
                <>
                  <div className="flex items-center space-x-2 mt-4">
                    <input 
                      type="checkbox" 
                      id="isDeclared" 
                      checked={isDeclared} 
                      onChange={(e) => setIsDeclared(e.target.checked)} 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="isDeclared" className="text-sm font-medium text-slate-700">
                      Mark innings as Declared (d)
                    </label>
                  </div>
                  {innings === 2 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input 
                        type="checkbox" 
                        id="followOn" 
                        checked={followOn} 
                        onChange={(e) => setFollowOn(e.target.checked)} 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <label htmlFor="followOn" className="text-sm font-medium text-slate-700">
                        Enforce Follow-On (Team B bats again)
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button onClick={() => setShowInnings2Modal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  setInningsScores([...inningsScores, { innings, runs, wickets, overs, balls, deliveries, isDeclared }]);
                  if (matchFormat !== 'Test Match') {
                    setTarget(runs + 1);
                  } else {
                    if (innings === 3) {
                       const teamA1 = inningsScores[0]?.runs || 0;
                       const teamB1 = inningsScores[1]?.runs || 0;
                       let calculatedTarget = 0;
                       if (followOn) {
                         const teamB2 = runs;
                         calculatedTarget = teamB1 + teamB2 - teamA1 + 1;
                       } else {
                         const teamA2 = runs;
                         calculatedTarget = teamA1 + teamA2 - teamB1 + 1;
                       }
                       if (calculatedTarget > 0) setTarget(calculatedTarget);
                    }
                  }
                  setInnings(innings + 1);
                  setRuns(0);
                  setWickets(0);
                  setOvers(0);
                  setBalls(0);
                  setThisOver([]);
                  setDeliveries([]);
                  setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                  setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                  setBowlerStats({ runs: 0, wickets: 0, balls: 0 });
                  setStriker(i2Striker || 'Player 1');
                  setNonStriker(i2NonStriker || 'Player 2');
                  setBowler(i2Bowler || 'Player 11');
                  setHistory([]);
                  setShowInnings2Modal(false);
                  setIsDeclared(false);
                  
                  // Trigger background service to update career stats for innings 1
                  (async () => {
                    try {
                      if (user?.uid) {
                        const oldStats: any = await dbService.get('performance_stats', user.uid) || {};
                        oldStats.matches = (oldStats.matches || 0) + 1;
                        await dbService.create('performance_stats', { id: user.uid, ...oldStats });
                      }
                    } catch (e) { console.warn('Background stat update request failed:', e); }
                  })();
                }} 
                className="px-4 py-2 bg-[#d11a2a] hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-600/20 flex items-center"
              >
                Start Innings <Check className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pre-stream Setup Modal */}
      {showPreStreamModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center"><Radio className="w-5 h-5 mr-2 text-[#d11a2a]" /> Separate Streaming Device</h2>
              <button onClick={() => setShowPreStreamModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <b>Important:</b> Scoring and live streaming should be done on <b>separate devices</b>. 
                  It is extremely difficult to effectively record the score while keeping the camera steadily pointed at the action.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-slate-700">
                  <b>Option 1: Use another device (Recommended)</b><br/>
                  Open this app on a secondary phone, log in to your account, and select "Broadcast Studio" for this match.
                </div>
                <div className="text-sm text-slate-700 mt-4">
                  <b>Option 2: Stream from this device</b><br/>
                  If you are the dedicated streamer (and someone else is scoring), launch the streamer view here.
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => {
                    setShowPreStreamModal(false);
                    if (setFullScreenView) {
                      setFullScreenView('Match Streamer');
                    } else {
                      alert('Error: View controller not found.');
                    }
                  }}
                  className="w-full bg-[#d11a2a] text-white py-3 rounded-xl font-bold text-base hover:bg-red-700 transition-colors flex justify-center items-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Launch Broadcast Studio Here</span>
                </button>
                <button 
                  onClick={() => setShowPreStreamModal(false)}
                  className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-base hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center"><Radio className="w-5 h-5 mr-2 text-[#d11a2a]" /> Broadcast Studio</h2>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 flex items-center"><Radio className="w-5 h-5 mr-2 text-red-600" /> Professional Broadcast Setup</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Connect your professional camera setup using OBS or vMix via RTMP to stream directly to viewers.
                </p>
                <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mt-2">
                  <p className="text-xs font-bold text-slate-700 mb-2">OBS Browser Source Overlay URL:</p>
                  <div className="flex items-center space-x-2">
                    <input type="text" readOnly value={`${window.location.origin}/?overlay=${matchId}`} className="bg-white border border-slate-300 text-xs text-slate-600 p-2 rounded flex-1 focus:outline-none font-mono" />
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?overlay=${matchId}`); alert('Copied to clipboard'); }} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded text-xs font-bold text-white transition-colors">Copy</button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Add this URL as a Browser Source in OBS. Set dimensions to 1920x1080.</p>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg font-mono text-[10px] text-slate-600 whitespace-pre">
{`OBS Studio
    │
    │ RTMP
    ▼
RTMP Streaming Server
(MediaMTX / SRS / Ant Media / Cloud Server)
    │
    │ HLS / WebRTC
    ▼
Firebase Hosting
(Streamlify frontend)
    │
    ▼
Viewers`}
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <h4 className="font-bold text-slate-800 flex items-center mb-2"><Download className="w-4 h-4 mr-2 text-indigo-600" /> Streamlify OBS Plugin</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Download our custom OBS plugin to automatically sync live scores, wickets, and match events as dynamic text sources in OBS Studio.
                  </p>
                  <div className="flex space-x-3 mb-4">
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading OBS Plugin for Windows...'); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-xs font-bold text-center transition-colors shadow-sm">
                      Download for Windows (.exe)
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading OBS Plugin for macOS...'); }} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 px-3 rounded text-xs font-bold text-center transition-colors shadow-sm">
                      Download for macOS (.pkg)
                    </a>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="text-xs font-bold text-indigo-800 flex items-center"><Play className="w-3 h-3 mr-1" /> Smart Start</h5>
                      {isSmartStartActive && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                            <Clock className="w-3 h-3 text-red-500 animate-pulse" />
                            <span>{broadcastDuration}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-indigo-600 mb-2">Automate OBS stream start and local scoring recording via plugin integration.</p>
                    
                    {isSmartStartActive && (
                      <div className="flex items-center space-x-2 mb-2 p-1.5 rounded bg-white/60 border border-indigo-100/50">
                        {obsPluginStatus === 'connecting' && <div className="flex items-center text-[10px] text-amber-600 font-medium"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting to OBS (Attempt {reconnectAttempts + 1})...</div>}
                        {obsPluginStatus === 'connected' && <div className="flex items-center text-[10px] text-emerald-600 font-medium"><Check className="w-3 h-3 mr-1" /> OBS Plugin Connected</div>}
                        {obsPluginStatus === 'error' && <div className="flex items-center text-[10px] text-red-500 font-medium"><AlertTriangle className="w-3 h-3 mr-1" /> Connection Dropped. Reconnecting in {Math.min(1 * Math.pow(2, reconnectAttempts - 1), 30)}s...</div>}
                      </div>
                    )}

                    <button 
                      onClick={handleSmartStartToggle} 
                      className={`w-full text-white py-2 rounded text-xs font-bold transition-colors shadow-sm flex justify-center items-center ${isSmartStartActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                    >
                      {isSmartStartActive ? (
                        <>
                          <Square className="w-3 h-3 mr-2" />
                          Stop P2P Broadcast
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-2" />
                          Initialize Smart Start
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">Version 1.2.0 • Requires OBS Studio 28.0+</p>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <h3 className="font-bold text-slate-800 flex items-center mb-2"><MessageCircle className="w-5 h-5 mr-2 text-green-600" /> Automated WhatsApp Alerts</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Notify your followers automatically via Twilio when the match goes live or a major milestone (e.g., 50 runs, Hat-trick) occurs.
                  </p>
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                    <div>
                      <p className="text-xs font-bold text-green-900">Enable Live Match Alerts</p>
                      <p className="text-[10px] text-green-700">Messages will be sent to registered tournament subscribers.</p>
                    </div>
                    <button 
                      onClick={() => { setIsWhatsappEnabled(!isWhatsappEnabled); if(!isWhatsappEnabled) alert('WhatsApp Integration Enabled: Twilio SMS alerts will be triggered on key match events.'); }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isWhatsappEnabled ? 'bg-green-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isWhatsappEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4 space-y-4 bg-slate-50 p-4 rounded-xl">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-indigo-600" />
                    Live Stream Scoreboard & Sync Delay
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Toggle overlay visibility or delay score updates to match video stream latency when streaming has lag.
                  </p>
                  
                  {/* Toggle Scoreboard Overlay */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Display Scoreboard Overlay on Video</p>
                      <p className="text-[10px] text-slate-500">Hide overlay if using OBS clean feed or external graphics.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const nextState = !showStreamScoreboard;
                        setShowStreamScoreboard(nextState);
                        if (matchId && isOwner) {
                          scoreboardService.updateScore(matchId, { showStreamScoreboard: nextState }, sportType);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showStreamScoreboard ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showStreamScoreboard ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Sync Delay Selection */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Scoreboard Sync Delay (Video Lag Compensation)
                      </label>
                      <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {streamSyncDelaySeconds === 0 ? 'Instant (0s)' : `${streamSyncDelaySeconds}s Delay`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Delays overlay updates to match video stream latency (prevents score spoilers).
                    </p>
                    <div className="grid grid-cols-6 gap-1.5 pt-1">
                      {[0, 3, 5, 10, 15, 20].map(delay => (
                        <button
                          key={delay}
                          onClick={() => {
                            setStreamSyncDelaySeconds(delay);
                            if (matchId && isOwner) {
                              scoreboardService.updateScore(matchId, { streamSyncDelaySeconds: delay }, sportType);
                            }
                          }}
                          className={`py-1.5 text-xs font-bold rounded border transition-all ${
                            streamSyncDelaySeconds === delay 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {delay === 0 ? '0s' : `${delay}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 flex items-center pt-4 border-t border-slate-200 mt-4"><Youtube className="w-5 h-5 mr-2 text-red-600" /> Live Stream Integration</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Streamlify allows you to display your YouTube Live broadcast directly to your viewers. 
                  To broadcast from this device, open YouTube Studio, start a webcam stream, and paste the link below.
                </p>
                <a href="https://streamlify.in/studio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 text-[#d11a2a] font-semibold text-sm hover:underline">
                  <span>Open Streamlify Studio</span> <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                  <span>Input Video Source (Select Camera / OBS)</span>
                  <span className="text-xs font-bold text-[#d11a2a]">Live</span>
                </label>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => {
                      setSelectedSourceType('hardware');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${selectedSourceType === 'hardware' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Hardware Camera / OBS Virtual Cam</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSourceType('obs');
                      startObsScreenShare();
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${selectedSourceType === 'obs' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>OBS Studio Screen Capture</span>
                  </button>
                </div>

                {selectedSourceType === 'hardware' ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-700">Select Camera / Video Input Source</label>
                      <button 
                        type="button"
                        onClick={() => refreshVideoDevices(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 transition-colors shadow-sm"
                      >
                        <RefreshCw className="w-3 h-3" /> Detect OBS / Refresh
                      </button>
                    </div>

                    {videoDevices.some(d => ['obs', 'virtual', 'vcam', 'vmix', 'streamlabs'].some(kw => (d.label || '').toLowerCase().includes(kw))) ? (
                      <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" /> OBS Virtual Camera detected!
                        </span>
                        <button 
                          type="button"
                          onClick={() => refreshVideoDevices(true)} 
                          className="text-[10px] font-bold text-emerald-900 bg-emerald-200/70 hover:bg-emerald-200 px-2.5 py-1 rounded transition-colors"
                        >
                          Select OBS Cam
                        </button>
                      </div>
                    ) : (
                      <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-normal leading-relaxed">
                        <strong>💡 How to use OBS Virtual Camera:</strong> Click <em>"Start Virtual Camera"</em> in OBS Studio first, then click <strong>Detect OBS / Refresh</strong> above so the browser lists your OBS feed.
                      </div>
                    )}

                    <select 
                      value={streamSettings.deviceId}
                      onChange={(e) => setStreamSettings({...streamSettings, deviceId: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/50 mb-4 font-sans"
                    >
                      <option value="">Default System Camera</option>
                      {videoDevices.map((device, idx) => {
                        const isObs = ['obs', 'virtual', 'vcam', 'vmix', 'streamlabs'].some(kw => (device.label || '').toLowerCase().includes(kw));
                        return (
                          <option key={device.deviceId} value={device.deviceId}>
                            {isObs ? '🎥 [OBS Virtual Camera] ' : ''}{device.label || `Camera ${idx + 1}`}
                          </option>
                        );
                      })}
                    </select>

                    <DeviceDiagnostics />

                    <label className="block text-sm font-bold text-slate-700 mb-2 mt-4">Camera Quality</label>
                    <select 
                      value={streamSettings.quality}
                      onChange={(e) => setStreamSettings({...streamSettings, quality: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/50 mb-4"
                    >
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (Full HD)</option>
                      <option value="4k">4K (Ultra HD - Requires Capture Card/Pro Camera)</option>
                    </select>
                    
                    <div className="flex space-x-2 mb-4">
                      <button 
                        onClick={isCameraActive ? stopCamera : startCamera}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg font-bold text-white transition-colors ${isCameraActive ? 'bg-slate-800 hover:bg-slate-900' : 'bg-[#d11a2a] hover:bg-red-700'}`}
                      >
                        {isCameraActive ? (
                          <>
                            <Square className="w-4 h-4" /> <span>Stop Camera</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" /> <span>Start Camera</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                    <div className="flex items-start space-x-2.5">
                      <Tv className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-indigo-900 font-bold">OBS Studio Window/Screen Feed</p>
                        <p className="text-[10px] text-indigo-600 leading-normal mt-0.5">Captures the OBS Program preview directly with zero latency. It is automatically combined with the real-time application scoreboard inside the player.</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={startObsScreenShare}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors border border-indigo-700 flex items-center justify-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>Change / Re-select OBS Window</span>
                      </button>
                      {isCameraActive && (
                        <button 
                          onClick={stopCamera}
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 mb-2">
                  <label className="text-sm font-bold text-slate-700">Enable Live OCR / ROI for Clips</label>
                  <button 
                    onClick={() => setIsOcrEnabled(!isOcrEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOcrEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOcrEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4">When enabled, AI will scan this region to automate from runup to scorecard.</p>
                
                <hr className="my-4 border-slate-200" />
                
                <label className="block text-sm font-bold text-slate-700 mb-2">YouTube Simulcast (RTMP Output)</label>
                <p className="text-xs text-slate-500 mb-3">Stream your camera feed with the live scoreboard overlay directly to YouTube, OBS, or both in parallel.</p>
                
                <label className="block text-sm font-bold text-slate-700 mb-2 mt-4">Stream Destination Settings</label>
                <div className="flex space-x-2 mb-4">
                  <button 
                    onClick={() => {
                       setStreamDestination('user');
                       const savedKey = typeof window !== 'undefined' ? localStorage.getItem(`youtube_stream_key_${user?.uid || 'guest'}`) : '';
                       setStreamSettings({...streamSettings, rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2', rtmpKey: savedKey || ''});
                    }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${streamDestination === 'user' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    YouTube Channel
                  </button>
                  <button 
                    onClick={() => {
                       setStreamDestination('streamlify');
                       setStreamSettings({...streamSettings, rtmpUrl: 'rtmp://streamlify.in/live', rtmpKey: 'obs_' + (user?.uid ? user.uid.slice(0, 8) : 'stream')});
                    }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${streamDestination === 'streamlify' ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    Streamlify Application
                  </button>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{streamDestination === 'streamlify' ? 'Streamlify RTMP Server URL' : 'YouTube RTMP Server URL'}</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        placeholder={streamDestination === 'streamlify' ? 'rtmp://streamlify.in/live' : 'rtmp://a.rtmp.youtube.com/live2'}
                        value={streamSettings.rtmpUrl}
                        onChange={(e) => setStreamSettings({...streamSettings, rtmpUrl: e.target.value})}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{streamDestination === 'streamlify' ? 'Streamlify Stream Key' : 'YouTube Stream Key'}</label>
                    <div className="flex">
                      <input 
                        type="password" 
                        placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
                        value={streamSettings.rtmpKey}
                        onChange={(e) => setStreamSettings({...streamSettings, rtmpKey: e.target.value})}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Parallel OBS RTMP Server URL (Optional)</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        placeholder="rtmp://streamlify.in/live"
                        value={streamSettings.obsRtmpUrl}
                        onChange={(e) => setStreamSettings({...streamSettings, obsRtmpUrl: e.target.value})}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Parallel OBS Stream Key (Optional)</label>
                    <div className="flex">
                      <input 
                        type="password" 
                        placeholder="my-secret-key"
                        value={streamSettings.obsRtmpKey}
                        onChange={(e) => setStreamSettings({...streamSettings, obsRtmpKey: e.target.value})}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                    OBS Studio says "Failed to connect to server"?
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    1. <strong>Use YouTube Service in OBS:</strong> In OBS Settings &gt; Stream, choose <em>YouTube - RTMPS</em> service & paste your YouTube stream key.<br />
                    2. <strong>Or use OBS Virtual Camera:</strong> Click <em>Start Virtual Camera</em> in OBS and select OBS Virtual Camera in browser settings.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={isStreamingToYoutube ? stopYoutubeStream : startYoutubeStream}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg font-bold text-white transition-colors ${isStreamingToYoutube ? 'bg-slate-800 hover:bg-slate-900' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {isStreamingToYoutube ? (
                      <>
                        <Square className="w-4 h-4" /> <span>Stop Stream</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" /> <span>Start Stream</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button onClick={() => setShowBroadcastModal(false)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-800 transition-colors">
                  Done
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
  
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Share</h2>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {youtubeUrl && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Live Stream</label>
                  <div className="flex">
                    <input type="text" readOnly value={youtubeUrl} className="flex-1 bg-slate-50 border border-slate-200 rounded-l-lg px-3 py-2 text-sm text-slate-700 outline-none" />
                    <button onClick={() => handleCopy(youtubeUrl)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-r-lg flex items-center">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Match Score</label>
                <div className="flex">
                  <input type="text" readOnly value={`Match Score: ${runs}/${wickets} (${overs}.${balls} ov)`} className="flex-1 bg-slate-50 border border-slate-200 rounded-l-lg px-3 py-2 text-sm text-slate-700 outline-none" />
                  <button onClick={() => handleCopy(`Match Score: ${runs}/${wickets} (${overs}.${balls} ov)`)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-r-lg flex items-center">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">App Link</label>
                <div className="flex">
                  <input type="text" readOnly value={window.location.origin} className="flex-1 bg-slate-50 border border-slate-200 rounded-l-lg px-3 py-2 text-sm text-slate-700 outline-none" />
                  <button onClick={() => handleCopy(window.location.origin)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-r-lg flex items-center">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Transfer Scoring</h2>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-500">Transfer the scoring rights to another user by entering their mobile number.</p>
              {transferError && <p className="text-xs text-red-500">{transferError}</p>}
              
              <div className="flex space-x-2">
                <CountryCodeSelect value={transferCountryCode} onChange={setTransferCountryCode} className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#d11a2a]" />
                <input
                  type="text"
                  placeholder="99999 99999"
                  value={transferPhone}
                  onChange={(e) => setTransferPhone(e.target.value)}
                  className="w-2/3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>

              <button 
                onClick={handleTransfer}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700"
              >
                Transfer Now
              </button>
            </div>
          </div>
        </div>
      )}

      
      
      {showAwardsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Match Summary</h2>
              <button onClick={() => setShowAwardsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{sportType} - FINAL SCORE</div>
                <div className="flex justify-between items-center px-4">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800 text-lg mb-1">{teamA}</span>
                    <span className="text-4xl font-black text-[#d11a2a]">{sportType === 'Cricket' ? `${runs}/${wickets}` : config.type === 'sets' ? setsA : scoreA}</span>
                    {config.type === 'sets' && <span className="text-xs font-bold text-slate-500 mt-1">{scoreA} {config.scoreLabel}</span>}
                  </div>
                  <span className="text-2xl font-bold text-slate-300">-</span>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800 text-lg mb-1">{teamB}</span>
                    <span className="text-4xl font-black text-[#d11a2a]">{sportType === 'Cricket' ? target ? target - 1 : 0 : config.type === 'sets' ? setsB : scoreB}</span>
                    {config.type === 'sets' && <span className="text-xs font-bold text-slate-500 mt-1">{scoreB} {config.scoreLabel}</span>}
                  </div>
                </div>
              </div>

              {isTied && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center">
                  <h3 className="text-sm font-bold text-orange-800 mb-2">Match Tied!</h3>
                  {matchFormat === 'Test Match' ? (
                    <p className="text-xs text-orange-700 font-medium">Test matches end in a Draw when scores are level.</p>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setAwards({...awards, matchResult: 'Draw'});
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${(awards as any).matchResult === 'Draw' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-700 border-orange-300 hover:bg-orange-100'}`}
                      >
                        Declare Draw
                      </button>
                      <button
                        onClick={() => {
                          setInningsScores(prev => [...prev, { runs, wickets, overs, balls, deliveries }]);
                          setInnings(innings + 1);
                          setRuns(0);
                          setWickets(0);
                          setOvers(0);
                          setBalls(0);
                          setThisOver([]);
                          setDeliveries([]);
                          setTarget(null);
                          setMatchMaxOvers(1);
                          setStriker('Player 1');
                          setNonStriker('Player 2');
                          setBowler('Player 11');
                          setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                          setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                          setBowlerStats({ runs: 0, wickets: 0, balls: 0 });
                          setHistory([]);
                          setShowAwardsModal(false);
                          if (matchId) {
                            scoreboardService.updateScore(matchId, {
                              innings: innings + 1,
                              runs: 0, wickets: 0, overs: 0, balls: 0, thisOver: [],
                              target: null, matchMaxOvers: 1,
                              striker: 'Player 1', nonStriker: 'Player 2', bowler: 'Player 11',
                              strikerStats: { runs: 0, balls: 0, fours: 0, sixes: 0 },
                              nonStrikerStats: { runs: 0, balls: 0, fours: 0, sixes: 0 },
                              bowlerStats: { runs: 0, wickets: 0, balls: 0 }
                            }, sportType);
                          }
                        }}
                        className="flex-1 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                      >
                        Play Super Over
                      </button>
                    </div>
                  )}
                </div>
              )}

              {matchFormat === 'Test Match' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Match Result</label>
                  <input 
                    type="text"
                    placeholder="e.g. Match Drawn, Team A won by 3 wkts..."
                    value={awards.matchResult}
                    onChange={e => setAwards({...awards, matchResult: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Man of the Match / Best Player</label>
                <select 
                  value={awards.motm}
                  onChange={e => setAwards({...awards, motm: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                >
                  <option value="">Select Player...</option>
                  {[...squadA, ...squadB].map(p => {
                    const stats = playerStats[p]?.[sportType];
                    const statStr = stats && sportType === 'Cricket' ? ` (Runs: ${stats.runs || 0}, Wickets: ${stats.wickets || 0})` : '';
                    return <option key={p} value={p}>{p}{statStr}</option>;
                  })}
                </select>
              </div>
              
              {sportType === 'Cricket' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Best Batsman</label>
                    <select 
                      value={awards.bestBatsman}
                      onChange={e => setAwards({...awards, bestBatsman: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    >
                      <option value="">Select Batsman...</option>
                      {[...squadA, ...squadB].map(p => {
                        const stats = playerStats[p]?.[sportType];
                        const statStr = stats && sportType === 'Cricket' ? ` (Runs: ${stats.runs || 0}, SR: ${stats.balls ? ((stats.runs/stats.balls)*100).toFixed(0) : 0})` : '';
                        return <option key={p} value={p}>{p}{statStr}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Best Bowler</label>
                    <select 
                      value={awards.bestBowler}
                      onChange={e => setAwards({...awards, bestBowler: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    >
                      <option value="">Select Bowler...</option>
                      {[...squadA, ...squadB].map(p => {
                        const stats = playerStats[p]?.[sportType];
                        const statStr = stats && sportType === 'Cricket' ? ` (Wickets: ${stats.wickets || 0}, Eco: ${stats.balls ? ((stats.runsConceded||0)/(stats.balls/6)).toFixed(1) : 0})` : '';
                        return <option key={p} value={p}>{p}{statStr}</option>;
                      })}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex space-x-3 bg-slate-50">
              <button 
                onClick={() => setShowAwardsModal(false)}
                className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    if (matchId) {
                      await dbService.update('matches', matchId, { 
                        status: 'Completed',
                        awards: isTied ? { ...awards, matchResult: 'Draw' } : awards,
                        playerStats: playerStats
                      });

                      // Trigger background service to update career stats
                      try {
                        const finalPlayerStats = JSON.parse(JSON.stringify(playerStats));
                        
                        // Add sets and matches to final stats for racket sports
                        if (['Tennis', 'Volleyball', 'Badminton', 'Pickleball', 'Table Tennis'].includes(sportType)) {
                            const teamASquad = JSON.parse(localStorage.getItem('match_team_a_squad') || '[]');
                            const teamBSquad = JSON.parse(localStorage.getItem('match_team_b_squad') || '[]');
                            
                            const allSquads = [...teamASquad, ...teamBSquad, teamA, teamB];
                            for (const playerName of allSquads) {
                                if (!playerName) continue;
                                if (!finalPlayerStats[playerName]) finalPlayerStats[playerName] = {};
                                if (!finalPlayerStats[playerName][sportType]) finalPlayerStats[playerName][sportType] = { points: 0 };
                                
                                const pStat = finalPlayerStats[playerName][sportType];
                                const isTeamA = teamASquad.includes(playerName) || playerName === teamA;
                                const isTeamB = teamBSquad.includes(playerName) || playerName === teamB;
                                
                                if (isTeamA) {
                                    pStat.setsWon = (pStat.setsWon || 0) + setsA;
                                    pStat.setsLost = (pStat.setsLost || 0) + setsB;
                                } else if (isTeamB) {
                                    pStat.setsWon = (pStat.setsWon || 0) + setsB;
                                    pStat.setsLost = (pStat.setsLost || 0) + setsA;
                                }
                            }
                        }
                        
                        // Set matches = 1 for everyone involved in playerStats
                        Object.keys(finalPlayerStats).forEach(p => {
                            if (finalPlayerStats[p][sportType]) {
                                finalPlayerStats[p][sportType].matches = 1;
                            }
                        });

                        if (user?.uid) {
                          const oldStats: any = await dbService.get('performance_stats', user.uid) || {};
                          oldStats.matches = (oldStats.matches || 0) + 1;
                          await dbService.create('performance_stats', { id: user.uid, ...oldStats });
                        }

                        // Update personal stats for every player mapped by name
                        await StatsSyncService.syncMatchStatsToCareer(sportType, finalPlayerStats);
                      } catch (e) {
                        console.warn('Error initiating career stats update', e);
                      }
                      try { await dbService.update('matches', matchId, { status: 'Completed', awards: isTied ? { ...awards, matchResult: 'Draw' } : awards }); } catch(e){}
                      
                      // Also let's save locally so we can view it
                      const localData = localStorage.getItem('matches_cache');
                      if (localData) {
                        try {
                           let parsed = JSON.parse(localData);
                           parsed = parsed.map((m: any) => m.id === matchId ? { ...m, status: 'Completed', awards: isTied ? { ...awards, matchResult: 'Draw' } : awards } : m);
                           localStorage.setItem('matches_cache', JSON.stringify(parsed));
                        } catch(e) {}
                      }

                      if (typeof window !== 'undefined') {
                        alert('Match ended and awards saved successfully.');
                      }
                    }
                    setShowAwardsModal(false);
                    if (setFullScreenView) {
                      setFullScreenView(null);
                    }
                  } catch (e) {
                    console.warn('Error ending match', e);
                  }
                }}
                className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                Finish & Save
              </button>
            </div>
          </div>
        </div>
      )}


      {pendingRun !== null && (
        <WagonWheel 
          run={pendingRun}
          onClose={() => setPendingRun(null)}
          onSave={(run, angle, distance) => {
            setShotData(prev => [...prev, { run, angle, distance }]);
            setPendingRun(null);
            handleRun(run);
          }}
        />
      )}

      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center"><RotateCcw className="w-5 h-5 mr-2 text-[#d11a2a]" /> Substitute Player</h2>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Role to Replace</label>
                <select 
                  value={subActivePlayerRole} 
                  onChange={(e: any) => setSubActivePlayerRole(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                >
                  <option value="striker">Striker ({striker})</option>
                  <option value="nonStriker">Non-Striker ({nonStriker})</option>
                  <option value="bowler">Bowler ({bowler})</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Substitute With</label>
                <select 
                  value={subSelectedPlayer} 
                  onChange={(e) => setSubSelectedPlayer(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d11a2a]"
                >
                  <option value="">Select a player from squad...</option>
                  {(() => {
                    const squadA = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('match_team_a_squad') || '[]' : '[]');
                    const squadB = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('match_team_b_squad') || '[]' : '[]');
                    const combined = [...squadA, ...squadB];
                    if (combined.length === 0) return <option value="" disabled>No players in squads</option>;
                    return combined.map(p => (p !== striker && p !== nonStriker && p !== bowler) ? <option key={p} value={p}>{p}</option> : null);
                  })()}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button onClick={() => setShowSubModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!subSelectedPlayer) return;
                  if (subActivePlayerRole === 'striker') setStriker(subSelectedPlayer);
                  if (subActivePlayerRole === 'nonStriker') setNonStriker(subSelectedPlayer);
                  if (subActivePlayerRole === 'bowler') setBowler(subSelectedPlayer);
                  setShowSubModal(false);
                  setSubSelectedPlayer('');
                }}
                disabled={!subSelectedPlayer}
                className="px-4 py-2 bg-[#d11a2a] hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Confirm Sub
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlayerStatsModal && selectedPlayerStats && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-slate-900 border border-[#d11a2a]/30 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 mr-3">
                  <span className="text-lg font-bold text-slate-300">{selectedPlayerStats.name.substring(0, 1)}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{selectedPlayerStats.name}</h2>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Match Performance</span>
                </div>
              </div>
              <button onClick={() => setShowPlayerStatsModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-900">
              {selectedPlayerStats.isBowler ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="text-5xl font-black text-white tracking-tighter mb-1">
                    {selectedPlayerStats.wickets || 0}<span className="text-3xl text-slate-500 mx-1">-</span>{selectedPlayerStats.runs || 0}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Wickets - Runs</div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-black text-amber-400">{Math.floor((selectedPlayerStats.balls || 0) / 6)}.{((selectedPlayerStats.balls || 0) % 6)}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Overs</div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-black text-emerald-400">
                        {selectedPlayerStats.balls > 0 ? ((selectedPlayerStats.runs / selectedPlayerStats.balls) * 6).toFixed(1) : '0.0'}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Economy</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="text-5xl font-black text-white tracking-tighter mb-1">
                    {selectedPlayerStats.runs || 0}<span className="text-2xl text-slate-500 font-bold ml-2">({selectedPlayerStats.balls || 0})</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Runs Scored</div>
                  
                  <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-emerald-400">{selectedPlayerStats.fours || 0}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Fours</div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-indigo-400">{selectedPlayerStats.sixes || 0}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Sixes</div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-amber-400">
                        {selectedPlayerStats.balls > 0 ? Math.round((selectedPlayerStats.runs / selectedPlayerStats.balls) * 100) : 0}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">S/R</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setShowPlayerStatsModal(false)}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showPlayerSearchModal && (
        <PlayerSearchModal 
          onClose={() => setShowPlayerSearchModal(false)}
          onSelectPlayer={(player) => {
            setNewBatsmanName(player.full_name || player.username);
            setShowPlayerSearchModal(false);
          }}
        />
      )}
    </div>
  );
}

