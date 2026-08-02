const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldAdminRule = `    function isAdmin() { 
       return (isSignedIn() && 
       ((exists(/databases/$(database)/documents/profiles/$(request.auth.uid)) && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin') || 
       request.auth.token.phone_number == '+916305605194' || 
       request.auth.token.phone_number == '+918688678943' ||
      request.auth.token.email == 'trinadhkalyanapu@gmail.com')); 
     }`;

const newAdminRule = `    function isAdmin() { 
       return isMock() || (isSignedIn() && 
       ((exists(/databases/$(database)/documents/profiles/$(request.auth.uid)) && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin') || 
       request.auth.token.phone_number == '+916305605194' || 
       request.auth.token.phone_number == '+918688678943' ||
      request.auth.token.email == 'trinadhkalyanapu@gmail.com')); 
     }`;

rules = rules.replace(oldAdminRule, newAdminRule);
fs.writeFileSync('firestore.rules', rules);
console.log('Updated isAdmin');
