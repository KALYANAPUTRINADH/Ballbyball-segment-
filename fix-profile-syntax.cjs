const fs = require('fs');

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

content = content.replace(/await dbService\.remove\('profiles', user\.uid\);\n catch\(e\)/g, "try { await dbService.remove('profiles', user.uid); } catch(e)");

fs.writeFileSync('src/pages/Profile.tsx', content);
