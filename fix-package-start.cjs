const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf-8');
code = code.replace(
  '"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=server.js"',
  '"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"'
);
code = code.replace(
  '"start": "node server.js"',
  '"start": "node dist/server.cjs"'
);
fs.writeFileSync('package.json', code);
