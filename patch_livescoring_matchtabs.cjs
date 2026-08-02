const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "deliveries={deliveries}\n            teamA={teamA}\n            teamB={teamB}\n          />",
  "deliveries={deliveries}\n            teamA={teamA}\n            teamB={teamB}\n            inningsScores={inningsScores}\n          />"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
