const fs = require('fs');
let content = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');
content = content.replace(/const rtmpServerUrl = typeof window[\s\S]*?;/, "const rtmpServerUrl = typeof window !== 'undefined' ? `rtmp://${window.location.hostname}/live` : 'rtmp://localhost/live';");
fs.writeFileSync('src/components/MatchStreamer.tsx', content);
