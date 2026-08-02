const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `const { getFirestore, FieldValue } = require('firebase-admin/firestore');`;
const replacement = `import { getFirestore, FieldValue } from 'firebase-admin/firestore';`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Patched import successfully.');
} else {
  console.log('Target not found.');
}
