const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "const [sportType, setSportType] = useState(savedState?.sportType ?? (typeof window !== 'undefined' ? localStorage.getItem('match_sport_type') || 'Cricket' : 'Cricket'));",
  "const [sportType, setSportType] = useState(savedState?.sportType ?? (typeof window !== 'undefined' ? localStorage.getItem('match_sport_type') || 'Cricket' : 'Cricket'));\n  const [matchFormat, setMatchFormat] = useState(savedState?.matchFormat ?? (typeof window !== 'undefined' ? localStorage.getItem('match_format') || 'T20' : 'T20'));"
);

code = code.replace(
  "history, scoreA, scoreB, setsA, setsB, period, sportType, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers}));",
  "history, scoreA, scoreB, setsA, setsB, period, sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers}));"
);

code = code.replace(
  ", sportType, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers]);",
  ", sportType, matchFormat, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers]);"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
