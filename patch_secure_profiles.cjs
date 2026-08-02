const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldProfilesRule = `    // 3. PROFILES
    match /profiles/{userId} {
      allow read, write: if true;
    }`;

const newProfilesRule = `    // 3. PROFILES
    match /profiles/{userId} {
      allow read: if true;
      allow create: if isOwner(userId) && (!('role' in incoming()) || incoming().role == 'user');
      allow update: if isOwner(userId) && (!('role' in incoming()) || incoming().role == existing().get('role', null)) || isAdmin();
      allow delete: if isAdmin();
    }`;

rules = rules.replace(oldProfilesRule, newProfilesRule);
fs.writeFileSync('firestore.rules', rules);
console.log('Restored secure profiles');
