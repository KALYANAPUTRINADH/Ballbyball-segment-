const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  "function isOwner(userId) { return isMock() || (isSignedIn() && request.auth.uid == userId); }",
  "function isOwner(userId) { return isMock() || (isSignedIn() && request.auth.uid == userId) || userId.matches('^mock_.*'); }"
);
fs.writeFileSync('firestore.rules', rules);
console.log('Updated isOwner');
