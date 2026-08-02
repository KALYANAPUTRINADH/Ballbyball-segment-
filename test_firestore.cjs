const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
try {
  initializeApp();
  const db = getFirestore();
  console.log("Admin Firestore initialized");
} catch(e) {
  console.log(e.message);
}
