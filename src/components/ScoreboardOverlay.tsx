import React, { useEffect, useState } from 'react';
import { ScoreboardWidget } from './ScoreboardWidget';
import { dbService } from '../lib/database';
import { scoreboardService } from '../services/ScoreboardService';
import { Settings, X } from 'lucide-react';

export function ScoreboardOverlay() {
  const [matchData, setMatchData] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [theme, setTheme] = useState('modern');
  const [scene, setScene] = useState<'default' | 'scoreboard-only' | 'minimalist' | 'hidden'>('default');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('overlay');
    if (!matchId) return;
    
    // Initial fetch
    dbService.get('matches', matchId).then(data => {
      if (data) setMatchData(data);
    });
    
    const unsubscribe = scoreboardService.subscribeToMatch(matchId, (data) => {
      setMatchData((prev: any) => ({ ...prev, ...data }));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('overlay');
    if (!matchId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/stream/obs-control?matchId=${matchId}`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'set-scene') {
            setScene(data.scene);
          } else if (data.type === 'set-theme') {
            setTheme(data.theme);
          }
        } catch (err) {
          console.error('Error processing WS overlay message:', err);
        }
      };
      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  if (!matchData) return <div className="text-white text-xs">Loading scoreboard...</div>;
  if (scene === 'hidden') return null;

  const isScoreboardOnly = scene === 'scoreboard-only';
  const displayTheme = scene === 'minimalist' ? 'minimalist' : theme;

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col justify-end p-8 pb-16 bg-transparent pointer-events-none relative transition-all duration-500 ${
      isScoreboardOnly ? 'bg-slate-950/70 backdrop-blur-md items-center !justify-center p-12' : ''
    }`}>
      
      {/* Configuration Panel Toggle */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="bg-slate-900/80 backdrop-blur border border-white/10 text-white p-2 rounded-full hover:bg-slate-800 transition-colors shadow-lg"
        >
          {showConfig ? <X size={20} /> : <Settings size={20} />}
        </button>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="absolute top-16 right-4 w-64 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl pointer-events-auto z-50 animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-white font-bold mb-4 border-b border-white/10 pb-2">Scoreboard Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Visual Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'minimalist', name: 'Minimal' },
                  { id: 'classic', name: 'Classic' },
                  { id: 'ipl', name: 'Digital' },
                  { id: 'modern', name: 'Modern' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      theme === t.id 
                        ? 'bg-[#d11a2a] text-white shadow-md' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto pointer-events-auto scale-[1.3] origin-bottom transform space-y-4">
        <ScoreboardWidget 
          matchId={matchData.id}
          teamA={matchData.team_a || matchData.teamA}
          teamB={matchData.team_b || matchData.teamB}
          runs={matchData.runs || 0}
          wickets={matchData.wickets || 0}
          overs={matchData.overs || matchData.overs_bowled || 0}
          balls={matchData.balls || 0}
          scoreA={matchData.scoreA ?? matchData.score_a ?? 0}
          scoreB={matchData.scoreB ?? matchData.score_b ?? 0}
          setsA={matchData.setsA ?? matchData.sets_a ?? 0}
          setsB={matchData.setsB ?? matchData.sets_b ?? 0}
          period={matchData.period ?? 1}
          sportType={matchData.sportType || matchData.sport_type || 'Cricket'}
          striker={matchData.striker}
          strikerStats={matchData.strikerStats}
          nonStriker={matchData.nonStriker}
          nonStrikerStats={matchData.nonStrikerStats}
          bowler={matchData.bowler}
          bowlerStats={matchData.bowlerStats}
          thisOver={matchData.thisOver}
          theme={displayTheme}
          target={matchData.target}
          innings={matchData.innings}
          inningsScores={matchData.inningsScores}
          className="w-full shadow-2xl border border-white/20"
        />
        
        {(!matchData.sport_type || matchData.sport_type === 'Cricket') && (
          (() => {
            const deliveries = matchData.deliveries && matchData.deliveries.length > 0 
              ? matchData.deliveries 
              : (matchData.thisOver || []).map((ball: string) => ({ type: ball }));

            if (deliveries.length === 0) return null;

            return (
              <div className="w-full bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 flex items-center space-x-4 overflow-x-auto hide-scrollbar pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
                <span className="text-white font-bold tracking-wider uppercase text-xs whitespace-nowrap shrink-0 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                  Recent Deliveries (Last 6):
                </span>
                <div className="flex space-x-2 shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
                  {deliveries.slice(-6).map((delivery: any, idx: number) => (
                    <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow transition-all transform hover:scale-105 duration-100 ${
                      delivery.type === 'W' ? 'bg-red-600 text-white shadow-red-500/50 border border-red-400' : 
                      delivery.type === '4' || delivery.type === '6' ? 'bg-emerald-600 text-white shadow-emerald-500/50 border border-emerald-400' :
                      delivery.type === '0' ? 'bg-slate-700 text-slate-300' :
                      'bg-slate-600 text-white border border-slate-500'
                    }`}>
                      {delivery.type}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
