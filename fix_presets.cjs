const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/deliveries:\s*\[\s*\{\s*over:[\s\S]*?\]\s*\}/g, 'deliveries: [] }');

fs.writeFileSync('server.ts', code);
