import React from 'react';
import { getSportConfig } from '../services/ScoreboardService';
import { ShareButton } from './ShareButton';
import { CricketScoreboardThemes } from './CricketScoreboardThemes';

export interface ScoreboardWidgetProps {
  matchId?: string;
  teamA?: string;
  teamB?: string;
  runs?: number;
  wickets?: number;
  overs?: number;
  balls?: number;
  striker?: string;
  strikerStats?: { runs?: number; balls?: number };
  nonStriker?: string;
  nonStrikerStats?: { runs?: number; balls?: number };
  bowler?: string;
  bowlerStats?: { wickets?: number; runs?: number; balls?: number };
  thisOver?: string[];
  className?: string;
  sportType?: string;
  scoreA?: number;
  scoreB?: number;
  setsA?: number;
  setsB?: number;
  period?: number;
  recentEvents?: any[];
  theme?: string;
  isExtraTime?: boolean;
  umpireSignal?: string | null;
}

export function ScoreboardWidget({ 
  matchId,
  teamA = 'Team A',
  teamB = 'Team B',
  runs = 0,
  wickets = 0,
  overs = 0,
  balls = 0,
  striker = 'Striker',
  strikerStats = { runs: 0, balls: 0 },
  nonStriker = 'Non-Striker',
  nonStrikerStats = { runs: 0, balls: 0 },
  bowler = 'Bowler',
  bowlerStats = { wickets: 0, runs: 0, balls: 0 },
  thisOver = [],
  className = '',
  sportType = 'Cricket',
  scoreA = 0,
  scoreB = 0,
  setsA = 0,
  setsB = 0,
  period = 1,
  recentEvents = [],
  theme = 'modern',
  isExtraTime = false,
  umpireSignal = null
}: ScoreboardWidgetProps) {
  const config = getSportConfig(sportType);

  // Period-based template (Football, Basketball, Hockey)
  if (config.type === 'periods' && sportType !== 'Basketball') {
    const periodDisplay = isExtraTime ? 'ET' : `${period}`;
    const periodLabel = isExtraTime ? 'Extra Time' : (config.periodLabel || 'Period');

    if (theme === 'classic') {
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="flex bg-[#0a192f] border-b-4 border-[#ffb703] overflow-hidden rounded-t-md shadow-2xl h-20 text-white font-sans">
            <div className="flex-1 flex items-center justify-between px-6 bg-[#020c1b]">
              <span className="text-xl font-bold uppercase tracking-wider truncate">{teamA}</span>
              <span className="text-4xl font-black text-[#ffb703]">{scoreA}</span>
            </div>
            <div className="w-32 bg-[#0a192f] flex flex-col items-center justify-center border-l border-r border-white/10 px-2">
              <span className="text-xs font-bold text-[#ffb703] uppercase tracking-wider">{periodLabel}</span>
              <span className="text-2xl font-black">{periodDisplay}</span>
            </div>
            <div className="flex-1 flex items-center justify-between px-6 bg-[#020c1b]">
              <span className="text-4xl font-black text-[#ffb703]">{scoreB}</span>
              <span className="text-xl font-bold uppercase tracking-wider text-right truncate">{teamB}</span>
            </div>
          </div>
          {recentEvents && recentEvents.length > 0 && (
            <div className="bg-[#020c1b]/95 text-slate-300 text-[10px] uppercase font-bold tracking-wider py-1.5 px-4 border-t border-[#ffb703] overflow-hidden flex whitespace-nowrap">
              <span className="text-[#ffb703] mr-2">LIVE SCOREBOARD EVENT:</span> 
              {recentEvents[0].playerName ? `${recentEvents[0].playerName} SCORED ${recentEvents[0].action}` : `${recentEvents[0].action}`}
            </div>
          )}
        </div>
      );
    }

    if (theme === 'minimalist') {
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="flex items-center bg-black/75 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 px-4 py-3 text-white font-mono justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <span className="text-lg font-bold">{teamA.substring(0, 3).toUpperCase()}</span>
              <span className="text-3xl font-black text-amber-400">{scoreA}</span>
            </div>
            <div className="text-center px-4 border-l border-r border-white/20">
              <div className="text-[9px] text-slate-400 uppercase tracking-widest leading-none">{periodLabel}</div>
              <div className="text-lg font-bold text-white">{periodDisplay}</div>
            </div>
            <div className="flex items-center justify-end space-x-4 flex-1 text-right">
              <span className="text-3xl font-black text-amber-400">{scoreB}</span>
              <span className="text-lg font-bold">{teamB.substring(0, 3).toUpperCase()}</span>
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'ipl') { // Digital theme
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="relative flex bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden shadow-2xl h-20 text-white font-sans border border-blue-900/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-25 mix-blend-overlay"></div>
            <div className="flex-1 flex items-center justify-between px-6 bg-gradient-to-r from-[#0f3460] to-transparent relative z-10">
              <span className="text-xl font-black tracking-wide truncate text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">{teamA}</span>
              <span className="text-4xl font-black text-[#e94560] drop-shadow-[0_0_8px_rgba(233,69,96,0.6)]">{scoreA}</span>
            </div>
            <div className="w-32 bg-gradient-to-br from-[#e94560] to-[#900c3f] flex flex-col items-center justify-center relative z-10 skew-x-[-10deg] -mx-1 px-4 text-white shadow-inner">
              <div className="skew-x-[10deg] text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">{periodLabel}</div>
                <div className="text-2xl font-black tracking-tighter">{periodDisplay}</div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-between px-6 bg-gradient-to-l from-[#0f3460] to-transparent relative z-10">
              <span className="text-4xl font-black text-[#e94560] drop-shadow-[0_0_8px_rgba(233,69,96,0.6)]">{scoreB}</span>
              <span className="text-xl font-black tracking-wide truncate text-right text-transparent bg-clip-text bg-gradient-to-l from-white to-slate-200">{teamB}</span>
            </div>
          </div>
        </div>
      );
    }

    // Modern (Default)
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl flex items-stretch h-20 text-white font-sans">
          <div className="flex-1 bg-slate-800/80 flex items-center justify-between p-4 px-6 border-r border-slate-700/50">
            <span className="font-bold text-2xl tracking-wide uppercase truncate">{teamA}</span>
            <span className="text-4xl font-black text-amber-400">{scoreA}</span>
          </div>
          <div className="w-32 bg-[#d11a2a]/10 flex flex-col items-center justify-center px-2 relative">
            <div className="text-xs font-bold tracking-widest text-[#d11a2a] uppercase mb-1">{periodLabel} {periodDisplay}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sportType}</div>
          </div>
          <div className="flex-1 bg-slate-800/80 flex items-center justify-between p-4 px-6 border-l border-slate-700/50">
            <span className="text-4xl font-black text-amber-400">{scoreB}</span>
            <span className="font-bold text-2xl tracking-wide uppercase truncate text-right">{teamB}</span>
          </div>
        </div>
        {recentEvents && recentEvents.length > 0 && (
          <div className="bg-slate-900/90 text-slate-300 text-[10px] uppercase font-bold tracking-wider py-1 px-4 border-t border-slate-700 overflow-hidden flex whitespace-nowrap">
            <span className="text-[#d11a2a] mr-2">LIVE:</span> 
            {recentEvents[0].playerName ? `${recentEvents[0].playerName} (${recentEvents[0].team === 'A' ? teamA : teamB}) SCORED ${recentEvents[0].action}` : `${recentEvents[0].team === 'A' ? teamA : teamB} SCORED ${recentEvents[0].action}`}
          </div>
        )}
      </div>
    );
  }

  // Basketball (or specific Quarter/Periods)
  if (sportType === 'Basketball') {
    if (theme === 'classic') {
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="flex bg-[#0a192f] border-b-4 border-amber-500 overflow-hidden rounded-t-md shadow-2xl h-20 text-white font-sans">
            <div className="w-20 bg-[#020c1b] flex flex-col items-center justify-center border-r border-slate-700">
               <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">QTR</span>
               <span className="text-2xl font-black text-white">{period}</span>
            </div>
            <div className="flex-1 bg-[#020c1b] flex items-center justify-between px-6 border-r border-slate-700">
              <span className="font-bold text-lg truncate">{teamA}</span>
              <span className="text-4xl font-black text-amber-400">{scoreA}</span>
            </div>
            <div className="flex-1 bg-[#020c1b] flex items-center justify-between px-6">
              <span className="text-4xl font-black text-amber-400">{scoreB}</span>
              <span className="font-bold text-lg truncate text-right">{teamB}</span>
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'minimalist') {
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="flex items-center bg-black/75 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 px-4 py-3 text-white font-mono justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <span className="text-lg font-bold">{teamA.substring(0, 3).toUpperCase()}</span>
              <span className="text-3xl font-black text-amber-400">{scoreA}</span>
            </div>
            <div className="text-center px-4 border-l border-r border-white/20">
              <div className="text-[9px] text-slate-400 uppercase tracking-widest">QTR</div>
              <div className="text-lg font-bold">{period}</div>
            </div>
            <div className="flex items-center justify-end space-x-4 flex-1 text-right">
              <span className="text-3xl font-black text-amber-400">{scoreB}</span>
              <span className="text-lg font-bold">{teamB.substring(0, 3).toUpperCase()}</span>
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'ipl') { // Digital theme
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="relative flex bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden shadow-2xl h-20 text-white font-sans border border-blue-900/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-25 mix-blend-overlay"></div>
            <div className="w-20 bg-gradient-to-b from-[#e94560]/20 to-[#900c3f]/20 flex flex-col items-center justify-center border-r border-slate-700/50 z-10">
               <span className="text-[10px] font-black text-[#e94560] tracking-widest">QTR</span>
               <span className="text-2xl font-black drop-shadow-[0_0_8px_rgba(233,69,96,0.6)]">{period}</span>
            </div>
            <div className="flex-1 flex items-center justify-between px-6 bg-gradient-to-r from-[#0f3460] to-transparent relative z-10">
              <span className="font-black text-xl tracking-wide truncate">{teamA}</span>
              <span className="text-4xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">{scoreA}</span>
            </div>
            <div className="flex-1 flex items-center justify-between px-6 bg-gradient-to-l from-[#0f3460] to-transparent relative z-10">
              <span className="text-4xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">{scoreB}</span>
              <span className="font-black text-xl tracking-wide truncate text-right">{teamB}</span>
            </div>
          </div>
        </div>
      );
    }

    // Modern theme (Default)
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex items-stretch h-20 text-white">
          <div className="w-20 bg-slate-800/90 flex flex-col items-center justify-center border-r border-slate-700">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{config.periodLabel || 'QTR'}</span>
             <span className="text-2xl font-black text-[#d11a2a]">{period}</span>
          </div>
          <div className="flex-1 bg-slate-800/80 flex items-center justify-between p-4 px-8 border-r border-slate-700/50">
            <span className="font-bold text-xl truncate">{teamA}</span>
            <span className="text-4xl font-black text-amber-400">{scoreA}</span>
          </div>
          <div className="flex-1 bg-slate-800/80 flex items-center justify-between p-4 px-8">
            <span className="text-4xl font-black text-amber-400">{scoreB}</span>
            <span className="font-bold text-xl truncate text-right">{teamB}</span>
          </div>
        </div>
      </div>
    );
  }

  // Sets-based template (Tennis, Badminton, Pickleball, Volleyball, Table Tennis)
  if (config.type === 'sets') {
    const isRally = config.isRallyScoring || sportType === 'Pickleball';

    if (theme === 'classic') {
      return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
          <div className="bg-[#0a192f] border-b-4 border-[#ffb703] overflow-hidden rounded-md shadow-2xl text-white font-sans">
            <div className="bg-[#020c1b] text-center py-1 border-b border-white/10">
              <span className="text-[10px] font-bold text-[#ffb703] uppercase tracking-widest">
                {sportType} {isRally && '(RALLY)'}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-3 px-4 border-b border-white/10 bg-[#0a192f]">
                <span className="font-bold text-lg truncate w-32">{teamA}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">{config.setsLabel || 'Sets'}</span>
                    <span className="text-xl font-bold">{setsA}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">Pts</span>
                    <span className="text-2xl font-black text-[#ffb703] w-10 text-right">{scoreA}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 px-4 bg-[#0a192f]">
                <span className="font-bold text-lg truncate w-32">{teamB}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">{config.setsLabel || 'Sets'}</span>
                    <span className="text-xl font-bold">{setsB}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">Pts</span>
                    <span className="text-2xl font-black text-[#ffb703] w-10 text-right">{scoreB}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'minimalist') {
      return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
          <div className="bg-black/75 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 text-white font-mono text-sm">
            <div className="bg-white/5 px-3 py-1 text-[10px] text-slate-400 uppercase tracking-widest flex justify-between">
              <span>{sportType}</span>
              {isRally && <span>RALLY SCORING</span>}
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{teamA.substring(0, 10)}</span>
                <div className="flex space-x-3">
                  <span>{config.setsLabel || 'Sets'}:{setsA}</span>
                  <span className="font-black text-amber-400">{scoreA}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span className="font-bold">{teamB.substring(0, 10)}</span>
                <div className="flex space-x-3">
                  <span>{config.setsLabel || 'Sets'}:{setsB}</span>
                  <span className="font-black text-amber-400">{scoreB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'ipl') { // Digital theme
      return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
          <div className="relative bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden shadow-2xl text-white font-sans border border-blue-900/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-25 mix-blend-overlay"></div>
            <div className="bg-gradient-to-r from-[#e94560] to-[#900c3f] text-center py-1 relative z-10 shadow-lg">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">{sportType} {isRally && '• RALLY SCORING'}</span>
            </div>
            <div className="flex flex-col relative z-10">
              <div className="flex items-center justify-between p-3 px-4 border-b border-blue-900/30 bg-[#0f3460]/40">
                <span className="font-black text-lg tracking-wide truncate w-32 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">{teamA}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">{config.setsLabel || 'Sets'}</span>
                    <span className="text-xl font-bold">{setsA}</span>
                  </div>
                  <div className="w-px h-8 bg-blue-900/50 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-[#e94560] font-black">Pts</span>
                    <span className="text-2xl font-black text-[#e94560] drop-shadow-[0_0_8px_rgba(233,69,96,0.6)] w-10 text-right">{scoreA}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 px-4 bg-[#0f3460]/20">
                <span className="font-black text-lg tracking-wide truncate w-32 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">{teamB}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">{config.setsLabel || 'Sets'}</span>
                    <span className="text-xl font-bold">{setsB}</span>
                  </div>
                  <div className="w-px h-8 bg-blue-900/50 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-[#e94560] font-black">Pts</span>
                    <span className="text-2xl font-black text-[#e94560] drop-shadow-[0_0_8px_rgba(233,69,96,0.6)] w-10 text-right">{scoreB}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Modern (Default)
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl text-white">
          <div className="bg-[#d11a2a] text-center py-1">
             <span className="text-[10px] font-bold text-white uppercase tracking-widest">{sportType} {isRally && '(RALLY SCORING)'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-3 px-4 border-b border-slate-700/50 bg-slate-800/80">
              <span className="font-bold text-lg truncate w-32">{teamA}</span>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">{config.setsLabel || 'Sets'}</span>
                  <span className="text-xl font-bold">{setsA}</span>
                </div>
                <div className="w-px h-8 bg-slate-700 mx-2"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">Pts</span>
                  <span className="text-2xl font-black text-amber-400 w-10 text-right">{scoreA}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 px-4 bg-slate-900/80">
              <span className="font-bold text-lg truncate w-32">{teamB}</span>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">{config.setsLabel || 'Sets'}</span>
                  <span className="text-xl font-bold">{setsB}</span>
                </div>
                <div className="w-px h-8 bg-slate-700 mx-2"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">Pts</span>
                  <span className="text-2xl font-black text-amber-400 w-10 text-right">{scoreB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Catch-all (for other sports)
  if (sportType !== 'Cricket') {
    if (theme === 'classic') {
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="flex bg-[#0a192f] border-b-4 border-[#ffb703] overflow-hidden rounded-t-md shadow-2xl h-20 text-white font-sans">
            <div className="w-1/3 bg-[#020c1b] flex items-center justify-center p-4">
              <span className="font-bold text-xl truncate">{teamA}</span>
            </div>
            <div className="w-1/3 bg-[#ffb703] text-[#0a192f] flex flex-col items-center justify-center px-6 relative">
              <div className="text-3xl font-black tabular-nums tracking-tighter">
                {scoreA} - {scoreB}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider">{sportType}</div>
            </div>
            <div className="w-1/3 bg-[#020c1b] flex items-center justify-center p-4">
              <span className="font-bold text-xl truncate text-right">{teamB}</span>
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'minimalist') {
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="flex items-center bg-black/75 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 px-4 py-3 text-white font-mono justify-between">
            <span className="text-lg font-bold">{teamA.substring(0, 3).toUpperCase()}</span>
            <span className="text-2xl font-black text-amber-400">{scoreA} - {scoreB}</span>
            <span className="text-lg font-bold">{teamB.substring(0, 3).toUpperCase()}</span>
          </div>
        </div>
      );
    }

    if (theme === 'ipl') { // Digital theme
      return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
          <div className="relative flex bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden shadow-2xl h-20 text-white font-sans border border-blue-900/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-25 mix-blend-overlay"></div>
            <div className="w-1/3 bg-gradient-to-r from-[#0f3460] to-transparent flex items-center justify-center p-4 relative z-10">
              <span className="font-black text-xl truncate">{teamA}</span>
            </div>
            <div className="w-1/3 bg-gradient-to-br from-[#e94560] to-[#900c3f] flex flex-col items-center justify-center px-6 relative z-10 skew-x-[-10deg]">
              <div className="skew-x-[10deg] text-center">
                <div className="text-3xl font-black tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  {scoreA} - {scoreB}
                </div>
                <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">{sportType}</div>
              </div>
            </div>
            <div className="w-1/3 bg-gradient-to-l from-[#0f3460] to-transparent flex items-center justify-center p-4 relative z-10">
              <span className="font-black text-xl truncate text-right">{teamB}</span>
            </div>
          </div>
        </div>
      );
    }

    // Modern (Default)
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
       <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex items-stretch h-20 text-white">
         <div className="w-1/3 bg-slate-800/80 flex items-center justify-center p-4">
           <span className="font-bold text-xl truncate">{teamA}</span>
         </div>
         <div className="w-1/3 bg-gradient-to-b from-[#d11a2a] to-red-900 flex flex-col items-center justify-center px-6 relative">
           <div className="text-3xl font-black tabular-nums tracking-tighter">
             {scoreA} - {scoreB}
           </div>
           <div className="text-[10px] uppercase font-bold tracking-wider text-white/80">{sportType}</div>
         </div>
         <div className="w-1/3 bg-slate-800/80 flex items-center justify-center p-4">
           <span className="font-bold text-xl truncate">{teamB}</span>
         </div>
       </div>
     </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {matchId && (
        <div className="flex justify-end p-2 bg-slate-800/80 rounded-t-xl overflow-hidden shadow-md border-b border-white/10">
          <ShareButton 
            title={`Score update: ${teamA} vs ${teamB}`}
            text="Check out the live score!"
            url={`${window.location.origin}/match/${matchId}`}
          />
        </div>
      )}
      <CricketScoreboardThemes 
        theme={theme}
        runs={runs}
        wickets={wickets}
        overs={overs}
        balls={balls}
        target={null}
        striker={striker}
        strikerStats={strikerStats}
        nonStriker={nonStriker}
        nonStrikerStats={nonStrikerStats}
        bowler={bowler}
        bowlerStats={bowlerStats}
        thisOver={thisOver}
        teamA={teamA}
        teamB={teamB}
      />
    </div>
  );
}
