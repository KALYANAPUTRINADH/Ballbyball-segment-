const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

// In useEffect
code = code.replace(
  "playerStats,\n        lastAutoSave: new Date().toISOString()",
  "playerStats,\n        recentEvents,\n        lastAutoSave: new Date().toISOString()"
);

// In deps
code = code.replace(
  "matchMaxOvers, inningsScores, playerStats]);",
  "matchMaxOvers, inningsScores, playerStats, recentEvents]);"
);

// In localStorage
code = code.replace(
  "matchMaxOvers, inningsScores, playerStats}));",
  "matchMaxOvers, inningsScores, playerStats, recentEvents}));"
);

// In actionModal submit
code = code.replace(
  "        history: [...history, {",
  "        recentEvents: [{ id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, team: actionModal.team, playerName: statScorer, action: `+${actionModal.points || 1}`, timestamp: new Date().toISOString() }, ...recentEvents].slice(0, 5),\n        history: [...history, {"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
