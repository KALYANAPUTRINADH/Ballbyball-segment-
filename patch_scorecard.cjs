const fs = require('fs');
let code = fs.readFileSync('src/components/MatchTabs.tsx', 'utf-8');

const cricketScorecardOld = `  return (
    <div className="p-0">
      <div className="bg-slate-800 text-white p-3 font-semibold text-sm flex justify-between">
        <span>{teamA} Innings</span>
        <span>{runs}/{wickets} ({overs}.{balls} Overs)</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="text-left font-semibold py-2 px-4">Batter</th>
            <th className="text-right font-semibold py-2 px-2">R</th>
            <th className="text-right font-semibold py-2 px-2">B</th>
            <th className="text-right font-semibold py-2 px-2">4s</th>
            <th className="text-right font-semibold py-2 px-2">6s</th>
            <th className="text-right font-semibold py-2 px-2">SR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-2 px-4">
              <div className="font-bold text-[#d11a2a]">{striker}*</div>
              <div className="text-xs text-slate-500">not out</div>
            </td>
            <td className="text-right font-bold py-2 px-2">{ss.runs}</td>
            <td className="text-right py-2 px-2 text-slate-600">{ss.balls}</td>
            <td className="text-right py-2 px-2 text-slate-600">{ss.fours}</td>
            <td className="text-right py-2 px-2 text-slate-600">{ss.sixes}</td>
            <td className="text-right py-2 px-2 text-slate-600">{ss.balls > 0 ? ((ss.runs / ss.balls) * 100).toFixed(1) : '-'}</td>
          </tr>
          <tr>
            <td className="py-2 px-4">
              <div className="font-bold text-slate-800">{nonStriker}</div>
              <div className="text-xs text-slate-500">not out</div>
            </td>
            <td className="text-right font-bold py-2 px-2">{nss.runs}</td>
            <td className="text-right py-2 px-2 text-slate-600">{nss.balls}</td>
            <td className="text-right py-2 px-2 text-slate-600">{nss.fours}</td>
            <td className="text-right py-2 px-2 text-slate-600">{nss.sixes}</td>
            <td className="text-right py-2 px-2 text-slate-600">{nss.balls > 0 ? ((nss.runs / nss.balls) * 100).toFixed(1) : '-'}</td>
          </tr>
        </tbody>
      </table>
      
      <table className="w-full text-sm mt-4 mb-4">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="text-left font-semibold py-2 px-4">Bowler</th>
            <th className="text-right font-semibold py-2 px-2">O</th>
            <th className="text-right font-semibold py-2 px-2">M</th>
            <th className="text-right font-semibold py-2 px-2">R</th>
            <th className="text-right font-semibold py-2 px-2">W</th>
            <th className="text-right font-semibold py-2 px-2">ER</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-2 px-4 font-bold text-slate-800">{bowler}</td>
            <td className="text-right py-2 px-2 text-slate-600">{Math.floor(bs.balls / 6)}.{bs.balls % 6}</td>
            <td className="text-right py-2 px-2 text-slate-600">0</td>
            <td className="text-right py-2 px-2 text-slate-600">{bs.runs}</td>
            <td className="text-right font-bold py-2 px-2 text-[#d11a2a]">{bs.wickets}</td>
            <td className="text-right py-2 px-2 text-slate-600">{bs.balls > 0 ? ((bs.runs / bs.balls) * 6).toFixed(1) : '-'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );`;

const cricketScorecardNew = `  // Get current innings team based on who is batting
  // The batting team is the one with the current striker
  const isTeamABatting = teamASquad?.includes(striker) || true; // Fallback to Team A if unknown
  const battingSquad = teamASquad || [];
  const bowlingSquad = teamBSquad || [];
  
  // Try to figure out who has batted and bowled
  const allBatters = battingSquad.length > 0 ? battingSquad : [striker, nonStriker];
  const allBowlers = bowlingSquad.length > 0 ? bowlingSquad : [bowler];

  return (
    <div className="p-0">
      <div className="bg-slate-800 text-white p-3 font-semibold text-sm flex justify-between">
        <span>Innings</span>
        <span>{runs}/{wickets} ({overs}.{balls} Overs)</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="text-left font-semibold py-2 px-4">Batter</th>
            <th className="text-right font-semibold py-2 px-2">R</th>
            <th className="text-right font-semibold py-2 px-2">B</th>
            <th className="text-right font-semibold py-2 px-2">4s</th>
            <th className="text-right font-semibold py-2 px-2">6s</th>
            <th className="text-right font-semibold py-2 px-2">SR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allBatters.map((player: string) => {
            const isStriker = player === striker;
            const isNonStriker = player === nonStriker;
            const stats = playerStats?.[player]?.Cricket || { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
            
            // Override with live stats if it's the current batsman
            const displayStats = isStriker ? ss : isNonStriker ? nss : stats;
            
            // Only show players who have batted or are currently batting
            if (displayStats.balls === 0 && !isStriker && !isNonStriker) return null;

            return (
              <tr key={player} className="hover:bg-slate-50">
                <td className="py-2 px-4">
                  <div className={\`font-bold \${isStriker ? 'text-[#d11a2a]' : 'text-slate-800'}\`}>
                    {player}{isStriker ? '*' : ''}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(isStriker || isNonStriker) ? 'not out' : (displayStats.out ? 'out' : 'did not bat')}
                  </div>
                </td>
                <td className="text-right font-bold py-2 px-2">{displayStats.runs || 0}</td>
                <td className="text-right py-2 px-2 text-slate-600">{displayStats.balls || 0}</td>
                <td className="text-right py-2 px-2 text-slate-600">{displayStats.fours || 0}</td>
                <td className="text-right py-2 px-2 text-slate-600">{displayStats.sixes || 0}</td>
                <td className="text-right py-2 px-2 text-slate-600">
                  {displayStats.balls > 0 ? ((displayStats.runs / displayStats.balls) * 100).toFixed(1) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <table className="w-full text-sm mt-4 mb-4">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="text-left font-semibold py-2 px-4">Bowler</th>
            <th className="text-right font-semibold py-2 px-2">O</th>
            <th className="text-right font-semibold py-2 px-2">M</th>
            <th className="text-right font-semibold py-2 px-2">R</th>
            <th className="text-right font-semibold py-2 px-2">W</th>
            <th className="text-right font-semibold py-2 px-2">ER</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allBowlers.map((player: string) => {
            const isCurrentBowler = player === bowler;
            const stats = playerStats?.[player]?.Cricket || { runsConceded: 0, wickets: 0, balls: 0 };
            
            // Calculate overs for display
            // If it's the current bowler, we use the live stats
            const ballsBowled = isCurrentBowler ? bs.balls : (stats.balls || 0);
            const runsConceded = isCurrentBowler ? bs.runs : (stats.runsConceded || 0);
            const bowlerWickets = isCurrentBowler ? bs.wickets : (stats.wickets || 0);
            
            if (ballsBowled === 0 && !isCurrentBowler) return null;

            return (
              <tr key={player} className="hover:bg-slate-50">
                <td className="py-2 px-4 font-bold text-slate-800">
                  {player}{isCurrentBowler ? '*' : ''}
                </td>
                <td className="text-right py-2 px-2 text-slate-600">
                  {Math.floor(ballsBowled / 6)}.{ballsBowled % 6}
                </td>
                <td className="text-right py-2 px-2 text-slate-600">0</td>
                <td className="text-right py-2 px-2 text-slate-600">{runsConceded}</td>
                <td className="text-right font-bold py-2 px-2 text-[#d11a2a]">{bowlerWickets}</td>
                <td className="text-right py-2 px-2 text-slate-600">
                  {ballsBowled > 0 ? ((runsConceded / ballsBowled) * 6).toFixed(1) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );`;

if (code.includes(cricketScorecardOld)) {
  code = code.replace(cricketScorecardOld, cricketScorecardNew);
  fs.writeFileSync('src/components/MatchTabs.tsx', code);
  console.log('Replaced correctly');
} else {
  console.log('Failed to match');
}
