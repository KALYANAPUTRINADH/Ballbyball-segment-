const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

let config = {};
try {
  config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
} catch (e) {
  console.log("No config");
}

const app = initializeApp({
  projectId: config.projectId
});

const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

async function test() {
  try {
    const snap = await db.collection('profiles').limit(1).get();
    console.log('Success:', snap.docs.length);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
