const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const https = require('https');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const app = initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId
});

app.options.credential.getAccessToken().then(token => {
  const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path: `/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/profiles`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token.access_token}`
    }
  };
  const req = https.request(options, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log("Response:", res.statusCode, data));
  });
  req.end();
});
