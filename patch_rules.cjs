const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');

// Replace isMock definition
code = code.replace(/function isMock\(\) \{ return request\.auth == null; \}/g, 'function isMock() { return false; }');
code = code.replace(/function isMock\(\) \{ return false; \}/g, 'function isMock() { return false; }'); // In case already false

fs.writeFileSync('firestore.rules', code);
console.log('Patched firestore.rules to return false for isMock()');
