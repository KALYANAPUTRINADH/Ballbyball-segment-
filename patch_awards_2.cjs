const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "const stats = playerStats[p]?.['Cricket'];",
  "const stats = playerStats[p]?.[sportType];"
).replace(
  "const stats = playerStats[p]?.['Cricket'];",
  "const stats = playerStats[p]?.[sportType];"
).replace(
  "const stats = playerStats[p]?.['Cricket'];",
  "const stats = playerStats[p]?.[sportType];"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
