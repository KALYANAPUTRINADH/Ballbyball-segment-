const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replaceAll('slicedBlob.type.includes("webm") ? "webm" : "mp4"', '"mp4"');
fs.writeFileSync('src/App.tsx', code);
