const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replaceAll('Scorecard Over {clip.over}.{clip.ball} Clip', '{clip.name.replace(".mp4", "")}');

fs.writeFileSync('src/App.tsx', code);
