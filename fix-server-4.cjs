const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// I will just locate the exact string starting at "    const docSnap" and ending at "});"
let idx1 = code.indexOf('    const docSnap = await userDocRef.get();');
if (idx1 !== -1) {
  let idx2 = code.indexOf('});', idx1);
  if (idx2 !== -1) {
    code = code.substring(0, idx1) + code.substring(idx2 + 3);
  }
}

// Check delete as well
idx1 = code.indexOf('    await db.collection(\'profiles\').doc(uid).delete();');
if (idx1 !== -1) {
  let idx2 = code.indexOf('});', idx1);
  if (idx2 !== -1) {
    code = code.substring(0, idx1) + code.substring(idx2 + 3);
  }
}
fs.writeFileSync('server.ts', code);
