const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const startIndex = code.indexOf('app.post("/api/looking_posts"');
const endIndexStr = 'app.delete("/api/users/delete"';
const indexOfEnd = code.indexOf(endIndexStr);

if (startIndex !== -1 && indexOfEnd !== -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(indexOfEnd);
  fs.writeFileSync('server.ts', before + '// Unused and insecure APIs removed' + '\n' + after);
  console.log('Removed unused insecure APIs successfully.');
} else {
  console.log('Could not find boundaries.');
}

