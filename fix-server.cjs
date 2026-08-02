const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('app.post("/api/users/sync"'));
const end = lines.findIndex((l, i) => i > start && l.trim() === '});' && lines[i-1].includes('res.status(500)'));
if (start !== -1 && end !== -1) {
  lines.splice(start, end - start + 1, `app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: 'Handled client-side' }); });`);
}
fs.writeFileSync('server.ts', lines.join('\n'));
