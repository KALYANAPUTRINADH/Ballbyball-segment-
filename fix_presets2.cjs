const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const updated = code.replace(/const PRESET_MATCHES = \[([\s\S]*?)\];\n\n/g, 'const PRESET_MATCHES: any[] = [];\n\n');
fs.writeFileSync('server.ts', updated);
