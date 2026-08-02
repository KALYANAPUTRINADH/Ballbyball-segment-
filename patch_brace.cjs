const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(/              \)\n              \{recentEvents/, "              )}\n              {recentEvents");

fs.writeFileSync('src/components/LiveScoring.tsx', code);
