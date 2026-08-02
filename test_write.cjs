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
    const res = await db.collection('test').add({ hello: 'world' });
    console.log('Success:', res.id);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
