const { initializeApp, credential } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({
  credential: credential.applicationDefault(),
  projectId: config.projectId
});
const db = getFirestore(config.firestoreDatabaseId);

db.collection('test_collection_xyz').get().then(snap => {
  console.log("Success! Docs test_collection_xyz:", snap.size);
}).catch(err => {
  console.error("Error on test_collection_xyz:", err.message);
});
