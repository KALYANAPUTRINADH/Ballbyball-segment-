const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  /setIsAdmin\(role === 'admin' \|\| phoneIsAdmin\);/,
  `setIsAdmin(role === 'admin' || phoneIsAdmin || user.email === 'trinadhkalyanapu@gmail.com');`
);
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
