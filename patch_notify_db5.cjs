const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `    const response = await getMessaging().sendEachForMulticast(message);`;

const replace = `    let response = null;
    if (tokens.length > 0) {
      try {
        response = await getMessaging().sendEachForMulticast(message);
      } catch(e) {
        console.error("FCM Send Error:", e);
      }
    }`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replace));
  console.log('Patched FCM call properly.');
} else {
  console.log('Target not found for FCM call.');
}
