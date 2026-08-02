const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `  // Catch-all for undefined API routes to return 404 instead of serving index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }`;

const replacement = `  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Catch-all for undefined API routes to return 404 instead of serving index.html
    app.all('/api/*', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
    
    // Catch-all for undefined static assets to return 404 (e.g. .png, .ico, .txt, .xml)
    app.get(/\\.(js|css|ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot|txt|xml|json)$/, (req, res) => {
      res.status(404).send('Not found');
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Patched API 404 in production block successfully.');
} else {
  console.log('Target not found.');
}
