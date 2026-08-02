const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `      localStorage.setItem('livescoring_state', JSON.stringify({
        runs, wickets, overs, balls, thisOver, target, striker, nonStriker, bowler, shotData, strikerStats, nonStrikerStats, bowlerStats
      , history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores}));
    }
  }, [runs, wickets, overs, balls, thisOver, target, striker, nonStriker, bowler, shotData, isOwner, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores]);`;

const newCode = `      localStorage.setItem('livescoring_state', JSON.stringify({
        runs, wickets, overs, balls, thisOver, target, striker, nonStriker, bowler, shotData, strikerStats, nonStrikerStats, bowlerStats
      , history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores, playerStats}));
    }
  }, [runs, wickets, overs, balls, thisOver, target, striker, nonStriker, bowler, shotData, isOwner, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores, playerStats]);`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
