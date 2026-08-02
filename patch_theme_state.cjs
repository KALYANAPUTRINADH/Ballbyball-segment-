const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "const [ownerId, setOwnerId] = useState<string | null>(null);",
  "const [ownerId, setOwnerId] = useState<string | null>(null);\n  const [scoreboardTheme, setScoreboardTheme] = useState(typeof window !== 'undefined' ? localStorage.getItem('scoreboard_theme') || 'modern' : 'modern');"
);

code = code.replace(
  "theme={typeof window !== 'undefined' ? localStorage.getItem('scoreboard_theme') || 'modern' : 'modern'}",
  "theme={scoreboardTheme}"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
