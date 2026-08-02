const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

const target = "<p>3. If using an android/iOS phone as an external camera, download <span className=\"text-blue-300 font-semibold\">IP Webcam</span>, start server, and paste the video URL above.</p>";
const replacement = target + "\n                <p>4. For Cloud Media Servers (e.g. MediaMTX, SRS), paste your remote URL to dynamically proxy the feed into the broadcast.</p>";

code = code.replace(target, replacement);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
