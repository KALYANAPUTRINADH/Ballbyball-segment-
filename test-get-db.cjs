const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId
});
const db = getFirestore(app, config.firestoreDatabaseId);

db.collection('profiles').limit(1).get().then(snap => {
  console.log("Success with getFirestore(app, dbId)! Count:", snap.size);
}).catch(err => {
  console.error("Error:", err.message);
});
