const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /\/\/ Helper to initialize custom Gemini API securely[\s\S]*?return cachedAiClient;\n}/g;
code = code.replace(regex, '');

fs.writeFileSync('server.ts', code);
