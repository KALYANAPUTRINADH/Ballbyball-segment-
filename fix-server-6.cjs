const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.post\("\/api\/users\/sync", requireAuth, async \(req: AuthRequest, res\) => \{ res\.json\(\{ success: true, message: 'Handled client-side' \}\); \}\);\s*\}/g, 'app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: "Handled client-side" }); });');

// also remove `});` if there's an orphaned one
code = code.replace(/app\.post\("\/api\/users\/sync", requireAuth, async \(req: AuthRequest, res\) => \{ res\.json\(\{ success: true, message: "Handled client-side" \}\); \}\);\s*\n\s*\n\s*\n \}\n\}\);\n/g, 'app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: "Handled client-side" }); });\n');

fs.writeFileSync('server.ts', code);
