const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const regex = /function isAdmin\(\) \{\s*return \(isSignedIn\(\) \&\&/g;
rules = rules.replace(regex, 'function isAdmin() { \n       return isMock() || (isSignedIn() &&');

fs.writeFileSync('firestore.rules', rules);
console.log('Updated isAdmin forcefully');
