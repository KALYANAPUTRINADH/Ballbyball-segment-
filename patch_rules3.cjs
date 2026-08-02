const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');

// Replace profiles update rule
const target = `allow update: if isOwner(userId) || isAdmin();`;
const replace = `allow update: if isAdmin() || (isOwner(userId) && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'is_pro', 'pro_expiration_date'])));`;

if (code.includes(target)) {
  fs.writeFileSync('firestore.rules', code.replace(target, replace));
  console.log('Patched profiles rules.');
} else {
  console.log('Target not found in firestore.rules');
}
