const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace deliveries: [...] inside PRESET_MATCHES
code = code.replace(/const PRESET_MATCHES = \[([\s\S]*?)\];\n\n\/\/ 1\./, 'const PRESET_MATCHES = [];\n\n// 1.');

fs.writeFileSync('server.ts', code);
