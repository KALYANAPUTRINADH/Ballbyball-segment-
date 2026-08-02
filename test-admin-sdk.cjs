const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

// The correct way in v12 is:
// getFirestore(app, databaseId) 
// or getFirestore(databaseId)
try {
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
  });
  
  // let's try calling the REST API directly using the access token from applicationDefault() to see if it works
  app.options.credential.getAccessToken().then(token => {
    console.log("Token:", token.access_token ? "Exists" : "None");
  }).catch(e => console.error("Cred err:", e.message));

} catch (e) {
  console.error("Init err:", e.message);
}
