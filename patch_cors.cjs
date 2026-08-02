const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `  origin: (origin, callback) => {
    // Dynamically allow any origin to prevent CORS blocks in the preview iframe
    callback(null, true);
  },`;

const replacement = `  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // In production, restrict to specific domains to make it "hacker proof"
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        'https://streamlify.in',
        'https://www.streamlify.in',
        'http://localhost:3000'
      ];
      // Allow AI studio subdomains just in case
      if (origin.includes('run.app') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('CORS policy violation'), false);
      }
    }
    // In dev, allow all
    callback(null, true);
  },`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Patched CORS policy successfully.');
} else {
  console.log('Target not found.');
}
