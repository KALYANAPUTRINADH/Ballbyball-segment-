const fs = require('fs');
let code = fs.readFileSync('./src/components/MatchStreamer.tsx', 'utf-8');

code = code.replace(
  "              thisOver={matchData.thisOver}",
  "              thisOver={matchData.thisOver}\n              umpireSignal={matchData.umpireSignal}"
);

fs.writeFileSync('./src/components/MatchStreamer.tsx', code);
