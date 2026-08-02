const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.post\("\/api\/users\/sync", requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?\}\);/m, `app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: 'Handled client-side' }); });`);

code = code.replace(/app\.delete\("\/api\/users\/delete", requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?\}\);/m, `app.delete("/api/users/delete", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: 'Handled client-side' }); });`);

fs.writeFileSync('server.ts', code);
