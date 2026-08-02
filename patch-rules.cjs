const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  /function isAdmin\(\) \{\s*return isSignedIn\(\) &&\s*\([\s\S]*?\);\s*\}/,
  `function isAdmin() { 
      return isSignedIn() && 
      (get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin' || 
      request.auth.token.phone_number == '+916305605194' || 
      request.auth.token.phone_number == '+918688678943' ||
      request.auth.token.email == 'trinadhkalyanapu@gmail.com'); 
    }`
);
fs.writeFileSync('firestore.rules', rules);
