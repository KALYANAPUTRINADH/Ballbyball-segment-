const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  /await dbService\.upsert\('profiles', \{\s*id: mappedUser\.uid,\s*full_name: mappedUser\.displayName \|\| '',\s*phone: mappedUser\.phoneNumber \|\| ''\s*\}\);/,
  `await dbService.upsert('profiles', {
        id: mappedUser.uid,
        uid: mappedUser.uid,
        full_name: mappedUser.displayName || '',
        username: mappedUser.displayName || '',
        email: mappedUser.email || '',
        phone: mappedUser.phoneNumber || '',
        photo_url: mappedUser.photoURL || '',
        updated_at: new Date().toISOString()
      });`
);
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
