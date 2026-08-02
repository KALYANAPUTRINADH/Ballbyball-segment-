const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
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

async function test() {
  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens: ['dummy_token_to_check_auth'],
      notification: { title: 'Test', body: 'Test' }
    });
    console.log('Success:', response);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
