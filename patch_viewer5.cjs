const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

code = code.replace(
  "if (pipEnabled && isLive) {",
  "if (pipEnabled && isLive && isOwner) {"
);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
