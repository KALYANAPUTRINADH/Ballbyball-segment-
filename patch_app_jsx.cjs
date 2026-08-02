const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/return \(\n\s*<CookieConsent \/>/g, "return (\n      <>\n        <CookieConsent />");
code = code.replace(/<TournamentHub setFullScreenView=\{handleSetFullScreenView\} \/>\n\s*\);/g, "<TournamentHub setFullScreenView={handleSetFullScreenView} />\n      </>\n    );");
fs.writeFileSync('src/App.tsx', code);
