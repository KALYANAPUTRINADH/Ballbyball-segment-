const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(/strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, deliveries, umpireSignal, playerStats\n\s*\}, sportType\);/, "strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, deliveries, umpireSignal, playerStats, scoreboardTheme\n      }, sportType);");

code = code.replace(/preDelayTarget, dlsOversLost, matchMaxOvers, target, playerStats\]\);/, "preDelayTarget, dlsOversLost, matchMaxOvers, target, playerStats, scoreboardTheme]);");

fs.writeFileSync('src/components/LiveScoring.tsx', code);
