const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('app.delete("/api/users/delete", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: \'Handled client-side\' }); });'));
if (start !== -1) {
  let end = start + 1;
  while(end < lines.length) {
    if (lines[end].trim() === '});' && lines[end-1].includes('res.status(500)')) {
      break;
    }
    end++;
  }
  lines.splice(start + 1, end - start);
}
fs.writeFileSync('server.ts', lines.join('\n'));
