const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId
});
const db = getFirestore(config.firestoreDatabaseId);

db.collection('profiles').limit(1).get().then(snap => {
  console.log("Success! Count:", snap.size);
}).catch(err => {
  console.error("Error:", err.message);
});
