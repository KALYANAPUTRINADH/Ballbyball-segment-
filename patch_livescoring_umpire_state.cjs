const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "const [activeBadge, setActiveBadge] = useState<{ title: string, playerName: string, type: 'batsman' | 'bowler' } | null>(null);",
  "const [activeBadge, setActiveBadge] = useState<{ title: string, playerName: string, type: 'batsman' | 'bowler' } | null>(null);\n  const [umpireSignal, setUmpireSignal] = useState<string | null>(savedState?.umpireSignal ?? null);"
);

code = code.replace(
  "strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, deliveries",
  "strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, deliveries, umpireSignal"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
