import React, { useState, useEffect } from 'react';
import { X, Settings, MonitorPlay, Copy, Check, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ScoreboardWidget } from './ScoreboardWidget';
import { ShareButton } from './ShareButton';
import { dbService } from '../lib/database';
import { VideoPlayer } from './VideoPlayer';

export function MatchStreamer({ matchId, setFullScreenView }: { matchId: string, setFullScreenView: (v: string | null) => void }) {
  const { user, isAdmin } = useAuth();
  const [matchData, setMatchData] = useState<any>(null);
  
  const isOwner = Boolean(
    !matchData || 
    !matchData.ownerId || 
    isAdmin || 
    (user && (
      matchData.ownerId === user.uid || 
      matchData.created_by === user.uid || 
      matchData.owner_id === user.uid
    ))
  );

  const [copiedServer, setCopiedServer] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showSettings, setShowSettings] = useState(isOwner);

  const rtmpServerUrl = typeof window !== 'undefined' ? `rtmp://${window.location.hostname}/live` : 'rtmp://localhost/live';
  const streamKey = `obs_${matchId}`;

  useEffect(() => {
    if (!matchId) return;
    const unsub = dbService.subscribeDoc('matches', matchId, (data) => {
      setMatchData(data);
    });
    return () => unsub();
  }, [matchId]);

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
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-30 absolute top-0 left-0 right-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg shadow-red-500/20">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <span>LIVE</span>
          </div>
          {matchData && (
            <div className="text-sm font-bold text-slate-200">
              {matchData.teamA} vs {matchData.teamB}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isOwner && (
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-red-600' : 'bg-slate-800/50 hover:bg-slate-700/50'} backdrop-blur-md`}
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <ShareButton 
            title={`Watch live: ${matchData?.teamA || 'Team A'} vs ${matchData?.teamB || 'Team B'}`}
            text="Watch the live stream!"
            url={`${window.location.origin}/live/${matchId}`}
          />
          <button onClick={() => setFullScreenView(null)} className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-full backdrop-blur-md transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
        <VideoPlayer streamKey={streamKey} />
        
        {/* Scoreboard Overlay */}
        <div className="absolute inset-x-0 bottom-16 z-20 pointer-events-none p-4">
          <ScoreboardWidget 
            matchId={matchId} 
             
             
          />
        </div>

        {/* OBS Setup Drawer for Owner */}
        {isOwner && showSettings && (
          <div className="absolute inset-y-0 right-0 w-96 bg-neutral-900 border-l border-neutral-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right overflow-y-auto">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 sticky top-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-red-500" />
                OBS Broadcasting
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
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

              
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
