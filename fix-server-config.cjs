const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace the static import of firebase config
code = code.replace("import firebaseConfig from './firebase-applet-config.json';", 
`import fs from "fs";
import path from "path";
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn("Could not load firebase config", e);
}
`);

fs.writeFileSync('server.ts', code);
