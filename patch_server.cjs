const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `  } else {
    const distPath = path.join(process.cwd(), 'dist');`;

const replacement = `  // Catch-all for undefined API routes to return 404 instead of serving index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  } else {
    const distPath = path.join(process.cwd(), 'dist');`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Patched API 404 catch-all successfully.');
} else {
  console.log('Target not found.');
}
