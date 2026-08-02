const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  projectId: 'ai-studio-cricketdeliverys-32a88b9d-2ebb-4791-88d9-8ef469d638bf'
});
const db = getFirestore('(default)');

db.collection('profiles').get().then(snap => {
  console.log("Success! Docs:", snap.size);
}).catch(err => {
  console.error("Error:", err.message);
});
