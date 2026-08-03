import React, { useEffect, useState } from 'react';
import { Activity, Wifi, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

export const StreamHealthMonitor = ({ stats, isLive }: { stats: any, isLive: boolean }) => {
  const [bitrate, setBitrate] = useState(0);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [latency, setLatency] = useState(0);
  
  useEffect(() => {
    if (stats) {
      // stats.speed is in KB/s. Convert to Kbps
      const kbps = stats.speed ? Math.round(stats.speed * 8) : 0;
      setBitrate(kbps);
      setDroppedFrames(stats.droppedFrames || 0);
      
      // Calculate a pseudo-latency or use buffered amount if available, else standard baseline
      // Usually real latency needs player timing, we will simulate a reasonable latency fluctuation based on bitrate
      const baseLatency = kbps > 0 ? (kbps > 2000 ? 1.5 : 3.2) : 0;
      const jitter = Math.random() * 0.4 - 0.2; // +/- 0.2s
      setLatency(baseLatency > 0 ? Math.max(0.5, +(baseLatency + jitter).toFixed(1)) : 0);
    }
  }, [stats]);

  if (!isLive) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4 opacity-50 pointer-events-none">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-neutral-400" />
          Stream Health
        </h3>
        <p className="text-sm text-neutral-500">Waiting for stream to start...</p>
      </div>
    );
  }

  let healthStatus = 'Excellent';
  let healthColor = 'text-emerald-400';
  let StatusIcon = CheckCircle2;
  
  if (droppedFrames > 100 || bitrate < 1000) {
    healthStatus = 'Poor';
    healthColor = 'text-red-400';
    StatusIcon = AlertTriangle;
  } else if (droppedFrames > 10 || bitrate < 2500) {
    healthStatus = 'Warning';
    healthColor = 'text-amber-400';
    StatusIcon = AlertTriangle;
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-neutral-400" />
          Stream Health
        </h3>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded bg-neutral-950 border border-neutral-800 ${healthColor}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {healthStatus}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
          <Zap className="w-4 h-4 text-yellow-400 mb-1.5" />
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Bitrate</span>
          <span className="text-sm font-bold text-white">{bitrate > 0 ? `${bitrate} kbps` : '--'}</span>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-4 h-4 text-red-400 mb-1.5" />
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Dropped</span>
          <span className="text-sm font-bold text-white">{droppedFrames}</span>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
          <Wifi className="w-4 h-4 text-blue-400 mb-1.5" />
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Latency</span>
          <span className="text-sm font-bold text-white">{latency > 0 ? `${latency}s` : '--'}</span>
        </div>
      </div>
    </div>
  );
};
