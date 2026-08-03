// PM2 / Node entry point for Streamlify (ESM compatible)
// Usage: node app.js OR pm2 start app.js --name streamlify-app

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distServer = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(distServer)) {
  console.log('🚀 Launching Streamlify Server from dist/server.cjs...');
  require(distServer);
} else {
  console.error('❌ Error: dist/server.cjs not found. Please run "npm run build" on your server first.');
  process.exit(1);
}
