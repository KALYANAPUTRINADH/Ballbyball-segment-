const fs = require('fs');

let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

const regex = /if \(data\.target \!\=\= undefined\) setTarget\(data\.target\);/;
const replace = `if (data.target !== undefined) setTarget(data.target);
          if (data.history) setHistory(data.history);
          if (data.innings !== undefined) setInnings(data.innings);
          if (data.inningsScores) setInningsScores(data.inningsScores);`;

if (regex.test(code)) {
  fs.writeFileSync('src/components/LiveScoring.tsx', code.replace(regex, replace));
  console.log('Patched LiveScoring.tsx viewer sync block.');
} else {
  console.log('Target not found for viewer sync block.');
}
