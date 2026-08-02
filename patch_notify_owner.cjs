const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `app.post("/api/notify", async (req, res) => {
  try {
    const { matchId, title, body, data } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: "No matchId provided" });
    }`;
const replace = `app.post("/api/notify", requireAuth, async (req: any, res: any) => {
  try {
    const { matchId, title, body, data } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: "No matchId provided" });
    }
    
    // Hacker proof: Ownership check for notifications
    const uid = (req as any).user?.uid;
    const isAdmin = (req as any).user?.role === 'admin';
    if (!isAdmin) {
       const matchSnap = await db.collection('matches').doc(matchId).get();
       let owner = null;
       if (matchSnap.exists) {
         owner = matchSnap.data().owner_id || matchSnap.data().created_by;
       } else {
         const tmSnap = await db.collection('tournaments').doc(matchId).get();
         if (tmSnap.exists) {
           owner = tmSnap.data().owner_id || tmSnap.data().created_by;
         }
       }
       if (owner !== uid) {
         return res.status(403).json({ error: 'Forbidden: You do not own this match/tournament' });
       }
    }`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replace));
  console.log('Patched notify ownership.');
} else {
  console.log('Target not found for notify ownership.');
}
