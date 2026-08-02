const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "const [innings, setInnings] = useState(savedState?.innings ?? 1);",
  "const [innings, setInnings] = useState(savedState?.innings ?? 1);\n  const [inningsScores, setInningsScores] = useState<any[]>(savedState?.inningsScores ?? []);"
);

code = code.replace(
  "history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers}));",
  "history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores}));"
);

code = code.replace(
  ", sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers]);",
  ", sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, inningsScores]);"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
