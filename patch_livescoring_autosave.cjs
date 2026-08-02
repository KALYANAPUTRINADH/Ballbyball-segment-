const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "strikerStats, nonStrikerStats, bowlerStats, history, scoreA, scoreB, setsA, setsB, period, sportType, deliveries, target, innings,",
  "strikerStats, nonStrikerStats, bowlerStats, history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, target, innings, inningsScores,"
);

code = code.replace(
  "scoreA, scoreB, setsA, setsB, period, sportType, deliveries, target, innings, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers]);",
  "scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, target, innings, inningsScores, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers]);"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
