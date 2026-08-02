const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace the client wrapper with admin SDK
const startIndex = code.indexOf('class DocRefWrapper');
const endIndex = code.indexOf('const FieldValue: any = {') + 'const FieldValue: any = {\n  serverTimestamp: () => clientServerTimestamp()\n};\n'.length;

const replacement = `
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId || '(default)');
`;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('server.ts', code);
  console.log('Replaced db wrapper with admin SDK successfully.');
} else {
  console.log('Could not find wrapper boundaries.');
}

