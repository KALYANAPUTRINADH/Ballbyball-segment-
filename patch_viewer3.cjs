const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

code = code.replace(
  "}, [useExternalCamera, externalCameraUrl]);",
  "}, [useExternalCamera, externalCameraUrl, isLive, isOwner]);"
);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
