const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const mockDataEndpoint = `
// Proxy server endpoints for mock data
app.get("/api/mock-data/performance/:sport", (req, res) => {
  const sport = req.params.sport.toLowerCase();
  
  if (sport === 'cricket') {
    return res.json({
      cricketStrikeRateData: [
        { match: 'Match 1', sr: 120, avg: 135 },
        { match: 'Match 2', sr: 145, avg: 135 },
        { match: 'Match 3', sr: 110, avg: 135 },
        { match: 'Match 4', sr: 160, avg: 135 },
        { match: 'Match 5', sr: 155, avg: 135 },
      ],
      cricketBowlingData: [
        { match: 'Match 1', wickets: 2, economy: 6.5 },
        { match: 'Match 2', wickets: 0, economy: 8.2 },
        { match: 'Match 3', wickets: 3, economy: 5.4 },
        { match: 'Match 4', wickets: 1, economy: 7.1 },
        { match: 'Match 5', wickets: 4, economy: 4.8 },
      ]
    });
  } else if (sport === 'football') {
    return res.json({
      footballPossessionData: [
        { match: 'Match 1', possession: 55, passAccuracy: 82 },
        { match: 'Match 2', possession: 60, passAccuracy: 88 },
        { match: 'Match 3', possession: 45, passAccuracy: 75 },
        { match: 'Match 4', possession: 65, passAccuracy: 90 },
        { match: 'Match 5', possession: 50, passAccuracy: 79 },
      ],
      footballAttackingData: [
        { name: 'Shots', A: 12, fullMark: 20 },
        { name: 'On Target', A: 6, fullMark: 20 },
        { name: 'Key Passes', A: 8, fullMark: 20 },
        { name: 'Dribbles', A: 15, fullMark: 20 },
        { name: 'Crosses', A: 7, fullMark: 20 },
      ]
    });
  } else if (sport === 'basketball') {
    return res.json({
      basketballShootingData: [
        { match: 'Match 1', fg: 45, '3pt': 33 },
        { match: 'Match 2', fg: 52, '3pt': 40 },
        { match: 'Match 3', fg: 38, '3pt': 25 },
        { match: 'Match 4', fg: 60, '3pt': 50 },
        { match: 'Match 5', fg: 48, '3pt': 35 },
      ],
      basketballStatsMap: [
        { name: 'Points', value: 24 },
        { name: 'Rebounds', value: 8 },
        { name: 'Assists', value: 6 },
        { name: 'Steals', value: 2 },
        { name: 'Blocks', value: 1 },
      ]
    });
  } else if (sport === 'tennis') {
    return res.json({
      tennisServeData: [
        { match: 'Match 1', firstServe: 65, aces: 5 },
        { match: 'Match 2', firstServe: 72, aces: 8 },
        { match: 'Match 3', firstServe: 58, aces: 3 },
        { match: 'Match 4', firstServe: 68, aces: 6 },
        { match: 'Match 5', firstServe: 75, aces: 10 },
      ]
    });
  }
  
  return res.json({
    defaultPerformanceData: [
      { metric: 'Game 1', score: 75, average: 70 },
      { metric: 'Game 2', score: 82, average: 70 },
      { metric: 'Game 3', score: 68, average: 70 },
      { metric: 'Game 4', score: 90, average: 70 },
      { metric: 'Game 5', score: 85, average: 70 },
    ]
  });
});

app.get("/api/mock-data/analytics", (req, res) => {
  res.json({
    completed: 12,
    upcoming: 5,
    ongoing: 2
  });
});
`;

if (!code.includes('/api/mock-data')) {
  code = code.replace("app.get(\"/api/preset-matches\"", mockDataEndpoint + "\napp.get(\"/api/preset-matches\"");
  fs.writeFileSync('server.ts', code);
}
