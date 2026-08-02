const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "if (match.team_a) setTeamA(match.team_a);\n            if (match.team_b) setTeamB(match.team_b);",
  "if (match.team_a) setTeamA(match.team_a);\n            if (match.team_b) setTeamB(match.team_b);\n            if (match.matchFormat) setMatchFormat(match.matchFormat);"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
