const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "team: innings === 1 ? 'A' : 'B'",
  "team: innings % 2 !== 0 ? 'A' : 'B'"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
