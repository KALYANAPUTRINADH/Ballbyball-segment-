const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

code = code.replace(
  "const data = await dbService.get('matches', matchId);",
  "const data: any = await dbService.get('matches', matchId);"
);

code = code.replace(
  "const unsubscribe = scoreboardService.subscribeToMatch(matchId, (newData) => {",
  "const unsubscribe = scoreboardService.subscribeToMatch(matchId, (newData: any) => {"
);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
