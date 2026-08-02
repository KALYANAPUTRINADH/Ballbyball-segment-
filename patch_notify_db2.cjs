const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `    if (tokens.length === 0) {
      return res.json({ success: true, message: 'No tokens to send to' });
    }`;
const replace = `    // We will not return early if no FCM tokens, so in-app notifications still work.
    // We will just skip the multicast send if tokens is empty.`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replace));
  console.log('Patched tokens length check.');
} else {
  console.log('Target not found for tokens length check.');
}
