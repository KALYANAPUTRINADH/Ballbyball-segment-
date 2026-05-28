const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replaceAll('ext = parts.pop();', 'ext = parts.pop() || ext;');
code = code.replaceAll('const extRaw = urlParts.pop().split("?")[0].split("#")[0];', 'const extLast = urlParts.pop(); const extRaw = extLast ? extLast.split("?")[0].split("#")[0] : "";');

fs.writeFileSync('src/App.tsx', code);
