const fs = require('fs');
let code = fs.readFileSync('./src/components/MatchTabs.tsx', 'utf-8');

code = code.replace(
  "<span className=\"text-xs font-bold text-slate-500 uppercase\">Recent Deliveries</span>",
  "<span className=\"text-xs font-bold text-slate-500 uppercase\">All Deliveries</span>"
);

code = code.replace(
  "{deliveries.slice(-10).reverse().map((d: any, idx: number) => (",
  "{[...deliveries].reverse().map((d: any, idx: number) => ("
);

fs.writeFileSync('./src/components/MatchTabs.tsx', code);
