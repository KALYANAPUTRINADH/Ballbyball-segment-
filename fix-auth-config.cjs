const fs = require('fs');
let code = fs.readFileSync('src/middleware/auth.ts', 'utf-8');

code = code.replace("import firebaseConfig from '../../firebase-applet-config.json';", 
`import fs from "fs";
import path from "path";
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn("Could not load firebase config in auth", e);
}
`);

fs.writeFileSync('src/middleware/auth.ts', code);
