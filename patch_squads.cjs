const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "const config = getSportConfig(sportType);",
  "const config = getSportConfig(sportType);\n  const squadA = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('match_team_a_squad') || '[]') : [];\n  const squadB = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('match_team_b_squad') || '[]') : [];\n  const battingSquad = innings % 2 !== 0 ? squadA : squadB;\n  const bowlingSquad = innings % 2 !== 0 ? squadB : squadA;"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
