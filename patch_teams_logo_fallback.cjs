const fs = require('fs');
let code = fs.readFileSync('src/components/Teams.tsx', 'utf-8');

code = code.replace(/\{team.logoUrl \? \(/g, "{(team.logoUrl || (team as any).logo) ? (");
code = code.replace(/<img src=\{team.logoUrl\}/g, "<img src={team.logoUrl || (team as any).logo}");

fs.writeFileSync('src/components/Teams.tsx', code);
