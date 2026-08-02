const fs = require('fs');
let code = fs.readFileSync('./src/services/ScoreboardService.ts', 'utf-8');

code = code.replace(
  "'activeBadge', 'lastAutoSave'];",
  "'activeBadge', 'lastAutoSave', 'umpireSignal'];"
);

fs.writeFileSync('./src/services/ScoreboardService.ts', code);
