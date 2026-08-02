const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "setInningsScores([...inningsScores, { innings, runs, wickets, overs, balls }]);",
  "setInningsScores([...inningsScores, { innings, runs, wickets, overs, balls, deliveries }]);"
);

code = code.replace(
  "setInningsScores(prev => [...prev, { runs, wickets, overs, balls }]);",
  "setInningsScores(prev => [...prev, { runs, wickets, overs, balls, deliveries }]);"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
