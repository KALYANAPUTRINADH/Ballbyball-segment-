const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `app.post("/api/notify", async (req, res) => {`;
const replace = `import { requireAuth } from './src/middleware/auth.ts';

app.post("/api/notify", requireAuth, async (req: any, res: any) => {`;

if (code.includes(target)) {
  code = code.replace(target, replace);
  // Add ownership check inside
  const ownershipTarget = `    if (!matchId) {
      return res.status(400).json({ error: "No matchId provided" });
    }`;
  const ownershipReplace = `    if (!matchId) {
      return res.status(400).json({ error: "No matchId provided" });
    }
    
    // Hacker proof: Ownership check for notifications
    const uid = (req as any).user?.uid;
    const isAdmin = (req as any).user?.role === 'admin';
    if (!isAdmin) {
       const matchSnap = await clientGetDocs(query(clientCollection(firestoreInstance, 'matches'), where('id', '==', matchId)));
       let owner = null;
       if (!matchSnap.empty) {
         owner = matchSnap.docs[0].data().owner_id || matchSnap.docs[0].data().created_by;
       } else {
         const tmSnap = await clientGetDocs(query(clientCollection(firestoreInstance, 'tournaments'), where('id', '==', matchId)));
         if (!tmSnap.empty) {
           owner = tmSnap.docs[0].data().owner_id || tmSnap.docs[0].data().created_by;
         }
       }
       // If no owner found or doesn't match, block notification
       // But wait, the matches use doc(id) so we should query by doc ID. In clientSDK, we use clientDoc.
    }`;
    // Actually wait, let's use the admin sdk 'db' object directly because we have it in server.ts.
    // 'db.collection' is available!
    
  // I will write a better patch scripts
}
