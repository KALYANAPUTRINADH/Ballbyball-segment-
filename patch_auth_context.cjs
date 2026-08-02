const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
code = code.replace(
  "const original_mockPhoneLogin = async (phone: string, name: string) => {",
  "const original_mockPhoneLogin = async (phone: string, name: string) => {\n    if (auth.currentUser) await auth.signOut();"
);
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Updated AuthContext');
