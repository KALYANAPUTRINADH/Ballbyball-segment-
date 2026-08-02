const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const oldModalCode = `            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button onClick={() => setShowInnings2Modal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  setTarget(runs + 1);
                  setInnings(2);
                  setRuns(0);
                  setWickets(0);
                  setOvers(0);
                  setBalls(0);
                  setThisOver([]);
                  setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                  setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                  setBowlerStats({ runs: 0, wickets: 0, balls: 0 });
                  setStriker(i2Striker || 'Player 1');
                  setNonStriker(i2NonStriker || 'Player 2');
                  setBowler(i2Bowler || 'Player 11');
                  setHistory([]);
                  setShowInnings2Modal(false);`;

const newModalCode = `            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button onClick={() => setShowInnings2Modal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  setInningsScores([...inningsScores, { innings, runs, wickets, overs, balls }]);
                  if (matchFormat !== 'Test Match') {
                    setTarget(runs + 1);
                  } else {
                    if (innings === 3) {
                       // Very rough target calculation for Test match, usually target = Team A total - Team B total + 1
                       const teamA1 = inningsScores[0]?.runs || 0;
                       const teamB1 = inningsScores[1]?.runs || 0;
                       const teamA2 = runs;
                       let calculatedTarget = teamA1 + teamA2 - teamB1 + 1;
                       if (calculatedTarget > 0) setTarget(calculatedTarget);
                    }
                  }
                  setInnings(innings + 1);
                  setRuns(0);
                  setWickets(0);
                  setOvers(0);
                  setBalls(0);
                  setThisOver([]);
                  setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                  setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                  setBowlerStats({ runs: 0, wickets: 0, balls: 0 });
                  setStriker(i2Striker || 'Player 1');
                  setNonStriker(i2NonStriker || 'Player 2');
                  setBowler(i2Bowler || 'Player 11');
                  setHistory([]);
                  setShowInnings2Modal(false);`;

code = code.replace(oldModalCode, newModalCode);

code = code.replace(
  '<h2 className="text-lg font-bold text-slate-900">Start 2nd Innings</h2>',
  '<h2 className="text-lg font-bold text-slate-900">Start Next Innings</h2>'
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
