const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  "allow read: if isOwner(existing().user_id) || isAdmin();",
  "allow read: if isMock() || (isSignedIn() && existing().user_id == request.auth.uid) || isAdmin();"
);
fs.writeFileSync('firestore.rules', rules);
console.log('Updated transactions read rule');
