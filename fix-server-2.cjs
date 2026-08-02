const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const lines = code.split('\n');

// Find where the trailing broken code is
const start = lines.findIndex(l => l.includes('    const { email, uid } = req.user;'));
if (start !== -1) {
  // It's line 1227 in the previous output. Let's find where the corresponding end is.
  let end = start;
  while(end < lines.length) {
    if (lines[end].trim() === '});' && lines[end-1] && lines[end-1].includes('res.status(500)')) {
      break;
    }
    end++;
  }
  if (end < lines.length) {
    lines.splice(start, end - start + 1);
  }
}
fs.writeFileSync('server.ts', lines.join('\n'));
