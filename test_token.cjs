const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
let config = {};
try {
  config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
} catch (e) {
  console.log("No config");
}
const app = initializeApp({ projectId: config.projectId });
async function test() {
  try {
    const token = await getAuth().createCustomToken('server_admin_bypass');
    console.log('Success:', token);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
