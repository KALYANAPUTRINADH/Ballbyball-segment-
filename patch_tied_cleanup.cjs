const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "{sportType === 'Cricket' && target && runs === target - 1 && ((matchFormat === 'Test Match' && innings === 4) || (matchFormat !== 'Test Match' && innings % 2 === 0)) && (",
  "{isTied && ("
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
