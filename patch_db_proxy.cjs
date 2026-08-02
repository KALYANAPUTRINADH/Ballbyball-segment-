const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// I will do string manipulation to slice out the block from `app.get("/api/db/get",` to the end of the `app.post("/api/db/remove",` block

const startIndex = code.indexOf('app.get("/api/db/get",');
const endIndexStr = 'app.post("/api/db/remove",';
const indexOfRemove = code.indexOf(endIndexStr);

// Find the closing bracket of the remove block
let braceCount = 0;
let endIndex = -1;
let started = false;

for (let i = indexOfRemove; i < code.length; i++) {
  if (code[i] === '{') {
    braceCount++;
    started = true;
  } else if (code[i] === '}') {
    braceCount--;
  }

  if (started && braceCount === 0) {
    // The next chars are usually `);`
    endIndex = code.indexOf(');', i) + 2;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex);
  fs.writeFileSync('server.ts', before + '// DB Proxy endpoints removed for security' + after);
  console.log('Removed DB proxy endpoints successfully.');
} else {
  console.log('Could not find boundaries.');
}

