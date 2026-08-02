const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `    const response = await getMessaging().sendEachForMulticast(message);
    res.json({ success: true, response });`;
const replace = `    const response = await getMessaging().sendEachForMulticast(message);
    
    // Also save in-app notification for all users
    try {
       const batch = db.batch();
       profilesSnap.forEach((doc) => {
         const uid = doc.id;
         const notifRef = db.collection('notifications').doc();
         batch.set(notifRef, {
           user_id: uid,
           title: title || "Live Match Update",
           body: body || "A match has been updated.",
           type: 'match_update',
           is_read: false,
           created_at: FieldValue.serverTimestamp(),
           action_url: matchId ? \`/?match=\${matchId}\` : undefined
         });
       });
       await batch.commit();
    } catch (e) {
       console.error("Failed to save in-app notifications", e);
    }

    res.json({ success: true, response });`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replace));
  console.log('Patched notify db save.');
} else {
  console.log('Target not found for notify db save.');
}
