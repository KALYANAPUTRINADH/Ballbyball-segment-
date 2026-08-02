const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

const target = `{` + `\`OBS Studio
     │
     │ RTMP / RTMPS
     ▼
RTMP Ingest Server
     │
     ├── Stream Recording
     ├── Transcoding / FFmpeg
     └── HLS / WebRTC Output
             │
             ▼
        Streamlify Player\`}
                </div>`;

const replacement = `{` + `\`OBS Studio
    │
    │ RTMP
    ▼
RTMP Streaming Server
(MediaMTX / SRS / Ant Media / Cloud Server)
    │
    │ HLS / WebRTC
    ▼
Firebase Hosting
(Streamlify frontend)
    │
    ▼
Viewers\`}
                </div>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/LiveScoring.tsx', code);
    console.log("Success");
} else {
    console.log("Target not found");
}
