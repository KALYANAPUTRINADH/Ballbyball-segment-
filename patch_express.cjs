const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /\/\/ Increase payload bounds for Base64 video uploads \(Must be initialized before defining routes\)\napp\.use\(express\.json\(\{ limit: '500mb' \}\)\);\napp\.use\(express\.urlencoded\(\{ limit: '500mb', extended: true \}\)\);/s;
const replace = `// Payload bounds
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));`;

if (regex.test(code)) {
  fs.writeFileSync('server.ts', code.replace(regex, replace));
  console.log('Patched express limits.');
} else {
  console.log('Target not found for express limits.');
}
