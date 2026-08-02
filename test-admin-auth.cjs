const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({ projectId: config.projectId });
const auth = getAuth();

auth.createCustomToken('mock_user_123').then(token => {
  console.log("Success! Token:", token);
}).catch(err => {
  console.error("Error creating token:", err.message);
});
