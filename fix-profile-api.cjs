const fs = require('fs');

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

content = content.replace(/await fetch\('\/api\/users\/sync'[^]+?\}\);/g, `
      await dbService.upsert('profiles', {
        id: user.uid,
        full_name: editName,
        phone: user.phoneNumber || ''
      });
`);

content = content.replace(/const res = await fetch\('\/api\/users\/delete'[^]+?if \(!res.ok\) \{[^]+?throw new Error[^]+?\}[^]+?\}/g, `
        await dbService.remove('profiles', user.uid);
`);

fs.writeFileSync('src/pages/Profile.tsx', content);
