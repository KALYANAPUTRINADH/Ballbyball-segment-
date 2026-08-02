const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `  }, [matchId, isOwner, runs, wickets, overs, balls, thisOver, striker, nonStriker, bowler, strikerStats, nonStrikerStats, bowlerStats, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, target, innings, inningsScores, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers]);`;

const newCode = `  }, [matchId, isOwner, runs, wickets, overs, balls, thisOver, striker, nonStriker, bowler, strikerStats, nonStrikerStats, bowlerStats, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, target, innings, inningsScores, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, playerStats]);`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
