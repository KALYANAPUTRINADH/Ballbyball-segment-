const fs = require('fs');
let code = fs.readFileSync('src/pages/ProDashboard.tsx', 'utf-8');

code = code.replace(/team.logo \?/g, "(team.logo || team.logoUrl) ?");
code = code.replace(/<img src=\{team.logo\}/g, "<img src={team.logo || team.logoUrl}");

fs.writeFileSync('src/pages/ProDashboard.tsx', code);
