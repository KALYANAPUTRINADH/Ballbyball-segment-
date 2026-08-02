import React from 'react';

export const CricketScoreboardThemes = ({
  theme, runs, wickets, overs, balls, target, 
  striker, strikerStats, nonStriker, nonStrikerStats, 
  bowler, bowlerStats, thisOver, teamA, teamB, onPlayerClick
}: any) => {
  const crr = (runs / Math.max(1, overs + balls/6)).toFixed(1);
  const teamALogo = localStorage.getItem('match_team_a_logo') || `https://ui-avatars.com/api/?name=${teamA}&background=0D8ABC&color=fff&rounded=true&bold=true`;
  const teamBLogo = localStorage.getItem('match_team_b_logo') || `https://ui-avatars.com/api/?name=${teamB}&background=d11a2a&color=fff&rounded=true&bold=true`;

  const renderPlayer = (name: string, stats: any, isBowler: boolean = false, className: string = "") => {
    return (
      <button 
        onClick={() => onPlayerClick && onPlayerClick({ name, ...stats, isBowler })}
        className={`hover:text-amber-400 hover:underline transition-colors focus:outline-none text-left ${className}`}
        title="View Performance"
      >
        {name}
      </button>
    );
  };

  if (theme === 'classic') {
    return (
      <div className="flex flex-col text-white font-sans drop-shadow-md">
        <div className="flex bg-[#0a192f] border-b-4 border-[#ffb703] overflow-hidden rounded-t-md shadow-2xl">
          <div className="flex items-center px-4 py-2 bg-[#020c1b]">
            <img src={teamALogo} alt="Team A" className="w-8 h-8 rounded-full mr-2 border border-white/20" />
            <span className="text-xl font-bold uppercase tracking-wider">{teamA.substring(0,3)}</span>
          </div>
          <div className="flex items-center px-6 py-2 bg-[#ffb703] text-[#0a192f]">
            <span className="text-3xl font-black">{runs}-{wickets}</span>
          </div>
          <div className="flex flex-col justify-center px-4 py-1 bg-[#0a192f] border-l border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overs</span>
            <span className="font-bold text-lg leading-none">{overs}.{balls}</span>
          </div>
          {target && (
            <div className="flex flex-col justify-center px-4 py-1 bg-[#0a192f] border-l border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target</span>
              <span className="font-bold text-lg leading-none">{target}</span>
            </div>
          )}
          <div className="flex items-center px-6 py-1 bg-[#0a192f] border-l border-white/10 flex-1 justify-end space-x-6 hidden md:flex">
             <div className="flex flex-col">
               <div className="flex items-center w-36"><span className="w-1.5 h-1.5 rounded-full bg-[#ffb703] mr-1.5"></span>{renderPlayer(striker, strikerStats, false, "font-bold flex-1 truncate")} <span className="font-bold">{strikerStats?.runs || 0}<span className="text-xs text-slate-400 ml-1">({strikerStats?.balls || 0})</span></span></div>
               <div className="flex items-center w-36 opacity-70 ml-3">{renderPlayer(nonStriker, nonStrikerStats, false, "font-bold flex-1 truncate")} <span>{nonStrikerStats?.runs || 0}<span className="text-xs text-slate-400 ml-1">({nonStrikerStats?.balls || 0})</span></span></div>
             </div>
             <div className="border-l border-white/10 pl-6 flex flex-col">
               <span className="text-slate-400 text-xs font-bold uppercase mb-0.5">Bowler</span>
               <div className="flex items-center">{renderPlayer(bowler, bowlerStats, true, "font-bold mr-3 truncate w-24")} <span className="font-bold text-[#ffb703]">{bowlerStats?.wickets || 0}-{bowlerStats?.runs || 0}</span></div>
             </div>
          </div>
        </div>
        {thisOver && thisOver.length > 0 && (
          <div className="flex bg-[#020c1b]/90 px-3 py-1.5 text-sm rounded-b-md">
            <span className="font-bold text-slate-400 uppercase mr-3">This Over:</span>
            <div className="flex space-x-1.5">
              {thisOver.map((ball: string, idx: number) => (
                <span key={idx} className={`font-bold ${ball === 'W' ? 'text-red-500' : ball === '6' || ball === '4' ? 'text-green-400' : 'text-white'}`}>{ball}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (theme === 'minimalist') {
    return (
      <div className="flex flex-col text-white font-mono drop-shadow-md">
        <div className="flex items-center bg-black/60 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 px-4 py-2 space-x-6">
          <div className="flex items-center space-x-2">
            <img src={teamALogo} alt="Team A" className="w-6 h-6 rounded-full" />
            <span className="text-lg font-bold">{teamA.substring(0,3)}</span>
            <span className="text-2xl font-black text-white">{runs}/{wickets}</span>
            <span className="text-sm text-slate-300 ml-2">({overs}.{balls})</span>
          </div>
          {target && (
            <div className="flex items-center border-l border-white/20 pl-6">
              <span className="text-xs text-slate-400 mr-2">TGT</span>
              <span className="font-bold">{target}</span>
            </div>
          )}
          <div className="flex items-center border-l border-white/20 pl-3 sm:pl-6 space-x-2 sm:space-x-4">
             <div className="flex items-center space-x-2"><span className="text-yellow-400 text-xs">▶</span>{renderPlayer(striker, strikerStats, false, "font-bold truncate w-16 sm:w-24 text-xs sm:text-base")} <span>{strikerStats?.runs || 0}</span></div>
             <div className="flex items-center space-x-2 text-slate-300">{renderPlayer(nonStriker, nonStrikerStats, false, "truncate w-16 sm:w-24 text-xs sm:text-base")} <span>{nonStrikerStats?.runs || 0}</span></div>
          </div>
          <div className="flex items-center border-l border-white/20 pl-3 sm:pl-6">
             <span className="text-slate-400 mr-2 text-xs">BOWL</span>
             {renderPlayer(bowler, bowlerStats, true, "font-bold mr-2 truncate w-16 sm:w-20 text-xs sm:text-base")} <span>{bowlerStats?.wickets || 0}-{bowlerStats?.runs || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  if (theme === 'ipl') {
    return (
      <div className="flex flex-col text-white font-sans drop-shadow-xl">
        <div className="flex bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden shadow-2xl border border-blue-900/50 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
          <div className="flex items-center px-4 py-3 bg-gradient-to-b from-[#0f3460] to-[#1a1a2e] relative z-10 border-r border-white/10 shadow-lg">
            <img src={teamALogo} alt="Team A" className="w-10 h-10 rounded-full border-2 border-[#e94560] shadow-[0_0_10px_rgba(233,69,96,0.5)] mr-3" />
            <span className="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300">{teamA.substring(0,3)}</span>
          </div>
          <div className="flex items-center px-6 py-3 bg-gradient-to-br from-[#e94560] to-[#900c3f] relative z-10 shadow-lg skew-x-[-10deg] -ml-2">
            <div className="skew-x-[10deg] flex items-baseline">
              <span className="text-4xl font-black tracking-tighter">{runs}</span>
              <span className="text-2xl font-bold mx-1 opacity-80">/</span>
              <span className="text-3xl font-bold">{wickets}</span>
            </div>
          </div>
          <div className="flex flex-col justify-center px-6 py-2 relative z-10">
            <span className="text-[10px] uppercase font-black text-[#e94560] tracking-widest">Overs</span>
            <span className="font-black text-xl leading-none tracking-wider">{overs}.{balls}</span>
          </div>
          {target && (
            <div className="flex flex-col justify-center px-4 py-2 relative z-10 border-l border-white/10">
              <span className="text-[10px] uppercase font-black text-amber-400 tracking-widest">Target</span>
              <span className="font-black text-xl leading-none">{target}</span>
            </div>
          )}
          <div className="flex items-center px-3 sm:px-6 py-2 relative z-10 border-l border-white/10 flex-1 justify-end space-x-2 sm:space-x-6">
             <div className="flex flex-col space-y-1">
               <div className="flex items-center w-28 sm:w-40"><span className="w-2 h-2 rounded-full bg-[#e94560] shadow-[0_0_5px_#e94560] mr-2"></span>{renderPlayer(striker, strikerStats, false, "font-bold flex-1 truncate tracking-wide text-[10px] sm:text-sm")} <span className="font-black">{strikerStats?.runs || 0}<span className="text-[10px] text-slate-400 ml-1 font-bold">({strikerStats?.balls || 0})</span></span></div>
               <div className="flex items-center w-28 sm:w-40 opacity-70 ml-2 sm:ml-4">{renderPlayer(nonStriker, nonStrikerStats, false, "font-bold flex-1 truncate tracking-wide text-[10px] sm:text-sm")} <span className="font-bold">{nonStrikerStats?.runs || 0}<span className="text-[10px] text-slate-400 ml-1">({nonStrikerStats?.balls || 0})</span></span></div>
             </div>
             <div className="border-l border-white/10 pl-2 sm:pl-6 flex flex-col space-y-1">
               <span className="text-[#e94560] text-[10px] font-black uppercase tracking-widest">Bowler</span>
               <div className="flex items-center">{renderPlayer(bowler, bowlerStats, true, "font-bold mr-1 sm:mr-3 truncate w-16 sm:w-24 tracking-wide text-[10px] sm:text-sm")} <span className="font-black">{bowlerStats?.wickets || 0}-{bowlerStats?.runs || 0}</span></div>
             </div>
          </div>
        </div>
        {thisOver && thisOver.length > 0 && (
          <div className="flex justify-end mt-2 relative z-10">
            <div className="flex bg-gradient-to-r from-transparent to-[#1a1a2e]/90 pr-4 py-1.5 items-center rounded-l-full">
              <span className="text-[10px] font-black text-amber-400 uppercase mr-3 tracking-widest">This Over:</span>
              <div className="flex space-x-1.5">
                {thisOver.map((ball: string, idx: number) => (
                  <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ${
                    ball === 'W' ? 'bg-[#e94560] text-white shadow-[0_0_5px_#e94560]' : 
                    ball === '6' ? 'bg-indigo-500 text-white shadow-[0_0_5px_#6366f1]' : 
                    ball === '4' ? 'bg-emerald-500 text-white shadow-[0_0_5px_#10b981]' : 
                    'bg-slate-700 text-slate-200'
                  }`}>
                    {ball}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default 'modern' theme
  return (
    <>
      <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-slate-700/50 flex justify-between items-center text-white shadow-2xl">
        <div className="flex items-center space-x-4">
          <img src={teamALogo} alt="Team A" className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover" />
          <div className="bg-[#d11a2a] px-3 py-1 rounded-lg shadow-inner flex items-center">
            <span className="text-3xl font-black">{runs}/{wickets}</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overs</div>
            <div className="font-bold">{overs}.{balls}</div>
          </div>
          {target && (
            <div className="hidden sm:block pl-4 border-l border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target</div>
              <div className="font-bold text-yellow-400">{target}</div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-6 text-[10px] sm:text-sm">
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4">
            <div className="flex justify-between w-24 sm:w-36"><span className="font-bold flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#d11a2a] mr-1.5"></span>{renderPlayer(striker, strikerStats, false, "truncate flex-1")}</span> <span className="font-bold">{strikerStats?.runs || 0} ({strikerStats?.balls || 0})</span></div>
            <div className="flex justify-between w-24 sm:w-36">{renderPlayer(nonStriker, nonStrikerStats, false, "opacity-70 truncate flex-1")} <span className="font-bold">{nonStrikerStats?.runs || 0} ({nonStrikerStats?.balls || 0})</span></div>
          </div>
          <div className="border-l border-slate-700 pl-2 sm:pl-6 flex flex-col sm:flex-row items-start sm:items-center">
            {renderPlayer(bowler, bowlerStats, true, "text-slate-400 mr-1 sm:mr-2 truncate w-20 sm:w-24")}
            <span className="font-bold">{bowlerStats?.wickets || 0}-{bowlerStats?.runs || 0}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2 text-sm border-l border-slate-600/50 pl-4 hidden sm:flex">
          <div className="flex space-x-2 bg-black/40 px-2 py-1 rounded-md"><span className="opacity-80">CRR:</span> <span className="font-bold text-amber-400">{crr}</span></div>
          <div className="flex space-x-2 bg-black/40 px-2 py-1 rounded-md"><span className="opacity-80">Bowler:</span> <span className="font-bold text-emerald-400 truncate w-24">{bowler}</span></div>
        </div>
      </div>
      {thisOver && thisOver.length > 0 && (
        <div className="flex justify-start mt-1">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-3 py-1.5 flex items-center space-x-2 shadow-lg">
            <span className="text-xs font-bold text-slate-300 uppercase mr-1 hidden sm:block">This Over:</span>
            {thisOver.map((ball: string, idx: number) => (
              <div key={idx} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
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
      )}
    </>
  );
};
