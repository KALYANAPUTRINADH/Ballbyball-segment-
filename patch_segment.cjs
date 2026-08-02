const fs = require('fs');

let code = fs.readFileSync('src/pages/VideoSegmentation.tsx', 'utf-8');

const regex = /body: JSON\.stringify\(\{\s*videoBase64: base64Data,\s*videoName: file\.name,\s*mimeType: file\.type,\s*useMock: false,\s*simulatedOverNumber: simulatedOver\s*\}\)/s;
const replace = `body: JSON.stringify({
            // We no longer send the raw video Base64 to the backend to avoid storing/handling large files.
            // videoBase64: base64Data,
            videoName: file.name,
            mimeType: file.type,
            useMock: false,
            simulatedOverNumber: simulatedOver
          })`;

if (regex.test(code)) {
  fs.writeFileSync('src/pages/VideoSegmentation.tsx', code.replace(regex, replace));
  console.log('Patched VideoSegmentation.tsx upload.');
} else {
  console.log('Target not found for VideoSegmentation.tsx upload.');
}
