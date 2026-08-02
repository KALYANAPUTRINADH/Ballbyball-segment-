const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

code = code.replace(
  "useState<'video_url' | 'mjpeg' | 'rtsp' | 'obs_rtmp'>('video_url');",
  "useState<'video_url' | 'mjpeg' | 'rtsp' | 'obs_rtmp' | 'cloud_media'>('video_url');"
);

code = code.replace(
  "<option value=\"rtsp\">RTSP Over WS Tunnel</option>",
  "<option value=\"rtsp\">RTSP Over WS Tunnel</option>\n                  <option value=\"cloud_media\">Cloud Media Server</option>"
);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
