const fs = require('fs');

let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

const regex = /\/\/ Periodic Auto-Save to Firestore to allow resuming match\s+useEffect\(\(\) => \{\s+if \(\!matchId \|\| \!isOwner\) return;\s+const intervalId = setInterval\(\(\) => \{\s+scoreboardService\.updateScore\(matchId, \{.*?\n\s+\}, sportType\);\s+\}, 60000\); \/\/ Save every 1 minute\s+return \(\) => clearInterval\(intervalId\);\s+\}, \[.*?\]\);/s;

const replace = `// Latest state ref for background sync job
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
  }, [matchId, isOwner]);`;

if (regex.test(code)) {
  fs.writeFileSync('src/components/LiveScoring.tsx', code.replace(regex, replace));
  console.log('Patched LiveScoring.tsx auto-save.');
} else {
  console.log('Target not found for auto-save using regex.');
}
